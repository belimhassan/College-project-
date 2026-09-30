// ==========================================
// COMMON HELPERS
// ==========================================

const API_URL = "api.php";

const taskList = document.getElementById("taskList");
const isDashboardPage = !!taskList;


// GET  -> apiRequest("me")
// POST -> apiRequest("add_task", { text: "..." })

async function apiRequest(action, data) {

    const options = {
        credentials: "same-origin"
    };

    let url = API_URL;

    if (data) {

        const formData = new FormData();

        formData.append("action", action);

        Object.keys(data).forEach(function (key) {
            formData.append(key, data[key]);
        });

        options.method = "POST";
        options.body = formData;

    } else {

        url += "?action=" + encodeURIComponent(action);
    }

    const response = await fetch(url, options);

    // Session khatam / login nahi hai -> login page
    if (response.status === 401 && isDashboardPage) {

        window.location.href = "index.html";

        // redirect hone tak aage ka code na chale
        return new Promise(function () {});
    }

    return response.json();
}


// ==========================================
// REGISTER
// ==========================================

const registerForm = document.getElementById("registerForm");

if (registerForm) {

    registerForm.addEventListener("submit", async function (event) {

        event.preventDefault();

        const name = document.getElementById("name").value.trim();
        const username = document.getElementById("username").value.trim().toLowerCase();
        const email = document.getElementById("email").value.trim().toLowerCase();
        const password = document.getElementById("password").value;
        const confirmPassword = document.getElementById("confirm").value;

        if (
            name === "" ||
            username === "" ||
            email === "" ||
            password === "" ||
            confirmPassword === ""
        ) {
            alert("Please fill all fields.");
            return;
        }

        if (password.length < 6) {
            alert("Password must be at least 6 characters.");
            return;
        }

        if (password !== confirmPassword) {
            alert("Passwords do not match.");
            return;
        }

        try {

            const data = await apiRequest("register", {
                name: name,
                username: username,
                email: email,
                password: password
            });

            if (!data.success) {
                alert(data.message || "Registration failed.");
                return;
            }

            alert("Registration successful!");

            window.location.href = "index.html";

        } catch (error) {

            console.error("Registration error:", error);
            alert("Server error. Please try again.");
        }
    });
}


// ==========================================
// LOGIN
// ==========================================

const loginForm = document.getElementById("loginForm");

if (loginForm) {

    loginForm.addEventListener("submit", async function (event) {

        event.preventDefault();

        const username = document.getElementById("username").value.trim().toLowerCase();
        const password = document.getElementById("password").value;

        if (username === "" || password === "") {
            alert("Please enter username and password.");
            return;
        }

        try {

            const data = await apiRequest("login", {
                username: username,
                password: password
            });

            if (!data.success) {
                alert(data.message || "Invalid username or password.");
                return;
            }

            window.location.href = "dashboard.html";

        } catch (error) {

            console.error("Login error:", error);
            alert("Server error. Please try again.");
        }
    });
}


// ==========================================
// DASHBOARD STATE
// ==========================================

let tasks = [];
let serverOffset = 0;      // server time - browser time (ms)
let timerIntervals = {};
let audioContext = null;


function serverNow() {
    return Date.now() + serverOffset;
}


// ==========================================
// DASHBOARD INIT (login check + welcome)
// ==========================================

async function initDashboard() {

    try {

        const me = await apiRequest("me");

        if (!me.success) {
            window.location.href = "index.html";
            return;
        }

        const welcomeMessage = document.getElementById("welcomeMessage");
        const userName = document.getElementById("userName");
        const welcomeName = document.getElementById("welcomeName");

        if (welcomeMessage) {
            welcomeMessage.textContent = "Welcome, " + me.user.name + "!";
        }

        if (userName) {
            userName.textContent = me.user.name;
        }

        if (welcomeName) {
            welcomeName.textContent = me.user.name;
        }

        await loadTasks();

    } catch (error) {

        console.error("Dashboard error:", error);
    }
}

if (isDashboardPage) {
    initDashboard();
}


// ==========================================
// LOGOUT
// ==========================================

const logoutBtn = document.getElementById("logoutBtn");

if (logoutBtn) {

    logoutBtn.addEventListener("click", async function () {

        try {
            await apiRequest("logout", {});
        } catch (error) {
            console.error("Logout error:", error);
        }

        window.location.href = "index.html";
    });
}


// ==========================================
// LOAD TASKS FROM SERVER
// ==========================================

async function loadTasks() {

    const data = await apiRequest("get_tasks");

    if (!data.success) {
        alert(data.message || "Could not load tasks.");
        return;
    }

    tasks = data.tasks;
    serverOffset = data.serverTime - Date.now();

    displayTasks();
    updateTaskStats();
}


// ==========================================
// ADD TASK
// ==========================================

const taskInput = document.getElementById("taskInput");
const addTaskBtn = document.getElementById("addTaskBtn");


async function addTask() {

    if (!taskInput) {
        return;
    }

    const taskText = taskInput.value.trim();

    if (taskText === "") {
        alert("Please enter a task.");
        return;
    }

    const durationSelect = document.getElementById("taskDuration");

    if (!durationSelect || durationSelect.value === "") {
        alert("Please select task duration.");
        return;
    }

    const prioritySelect = document.getElementById("taskPriority");
    const dueDateInput = document.getElementById("taskDueDate");

    // Notification permission user click par maangte hain
    if ("Notification" in window && Notification.permission === "default") {
        Notification.requestPermission();
    }

    addTaskBtn.disabled = true;

    try {

        const data = await apiRequest("add_task", {
            text: taskText,
            duration: durationSelect.value,
            priority: prioritySelect ? prioritySelect.value : "medium",
            dueDate: dueDateInput ? dueDateInput.value : ""
        });

        if (!data.success) {
            alert(data.message || "Task could not be added.");
            return;
        }

        taskInput.value = "";

        await loadTasks();

    } catch (error) {

        console.error("Add task error:", error);
        alert("Server error. Please try again.");

    } finally {

        addTaskBtn.disabled = false;
    }
}

if (addTaskBtn) {
    addTaskBtn.addEventListener("click", addTask);
}

// Enter key se task add
if (taskInput) {

    taskInput.addEventListener("keydown", function (event) {

        if (event.key === "Enter") {
            addTask();
        }
    });
}


// ==========================================
// DISPLAY TASKS
// ==========================================

function displayTasks() {

    if (!taskList) {
        return;
    }

    clearAllTimers();

    taskList.innerHTML = "";

    if (tasks.length === 0) {
        taskList.innerHTML = "<li>No tasks yet.</li>";
        return;
    }

    tasks.forEach(function (task) {

        const li = document.createElement("li");

        li.className = "task-item";

        if (task.completed) {
            li.classList.add("completed");
        }

        // ---- left side: checkbox, text, priority, due date ----

        const leftSide = document.createElement("div");

        const checkbox = document.createElement("input");

        checkbox.type = "checkbox";
        checkbox.checked = task.completed;

        checkbox.addEventListener("change", function () {
            toggleTask(task.id);
        });

        const text = document.createElement("span");

        text.textContent = task.text;

        const priority = document.createElement("small");

       priority.textContent =
    task.priority === "high"
        ? " " + String.fromCodePoint(0x1F534) + " High"
        : task.priority === "low"
            ? " " + String.fromCodePoint(0x1F7E2) + " Low"
            : " " + String.fromCodePoint(0x1F7E1) + " Medium";

        priority.className = "task-priority";

        leftSide.appendChild(checkbox);
        leftSide.appendChild(text);
        leftSide.appendChild(priority);

        if (task.dueDate) {

            const dueDate = document.createElement("small");

            dueDate.textContent = " \uD83D\uDCC5 " + task.dueDate;
            dueDate.className = "task-due-date";

            leftSide.appendChild(dueDate);
        }

        // ---- buttons ----

        const editButton = document.createElement("button");

        editButton.textContent = "Edit";

        editButton.addEventListener("click", function () {
            editTask(task.id);
        });

        const deleteButton = document.createElement("button");

        deleteButton.textContent = "Delete";

        deleteButton.addEventListener("click", function () {
            deleteTask(task.id);
        });

        const buttons = document.createElement("div");

        buttons.appendChild(editButton);
        buttons.appendChild(deleteButton);

        // ---- timer ----

        const timerElement = document.createElement("span");

        timerElement.id = "timer-" + task.id;
        timerElement.className = "task-timer";

        li.appendChild(leftSide);
        li.appendChild(timerElement);
        li.appendChild(buttons);

        taskList.appendChild(li);

        if (task.completed) {

            timerElement.textContent = "\u2705 Completed";

        } else if (task.timeOver) {

            timerElement.textContent = "\u23F0 Time Over";

        } else if (task.timerEnd) {

            runTaskTimer(task.id);

        } else {

            timerElement.textContent = "\u23F8\uFE0F Timer stopped";
        }
    });
}


// ==========================================
// COMPLETE / UNCOMPLETE TASK
// ==========================================

async function toggleTask(id) {

    try {

        const data = await apiRequest("toggle_task", { id: id });

        if (!data.success) {
            alert(data.message || "Could not update task.");
        }

        await loadTasks();

    } catch (error) {

        console.error("Toggle error:", error);
        alert("Server error. Please try again.");
    }
}


// ==========================================
// EDIT TASK
// ==========================================

async function editTask(id) {

    const task = tasks.find(function (item) {
        return item.id === id;
    });

    if (!task) {
        return;
    }

    const newText = prompt("Edit your task:", task.text);

    if (newText === null || newText.trim() === "") {
        return;
    }

    try {

        const data = await apiRequest("edit_task", {
            id: id,
            text: newText.trim()
        });

        if (!data.success) {
            alert(data.message || "Could not edit task.");
            return;
        }

        await loadTasks();

    } catch (error) {

        console.error("Edit error:", error);
        alert("Server error. Please try again.");
    }
}


// ==========================================
// DELETE TASK
// ==========================================

async function deleteTask(id) {

    if (!confirm("Do you want to delete this task?")) {
        return;
    }

    try {

        const data = await apiRequest("delete_task", { id: id });

        if (!data.success) {
            alert(data.message || "Could not delete task.");
            return;
        }

        await loadTasks();

    } catch (error) {

        console.error("Delete error:", error);
        alert("Server error. Please try again.");
    }
}


// ==========================================
// TASK TIMER
// ==========================================

function stopTaskTimer(taskId) {

    if (timerIntervals[taskId]) {

        clearInterval(timerIntervals[taskId]);

        delete timerIntervals[taskId];
    }
}


function clearAllTimers() {

    Object.keys(timerIntervals).forEach(function (taskId) {
        clearInterval(timerIntervals[taskId]);
    });

    timerIntervals = {};
}


function formatRemaining(remaining) {

    const totalSeconds = Math.floor(remaining / 1000);

    const hours = Math.floor(totalSeconds / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);
    const seconds = totalSeconds % 60;

    if (hours > 0) {
        return hours + "h " + minutes + "m " + seconds + "s";
    }

    return minutes + "m " + seconds + "s";
}


function runTaskTimer(taskId) {

    stopTaskTimer(taskId);

    // true = timer abhi chal raha hai, false = khatam / band
    function tick() {

        const task = tasks.find(function (item) {
            return item.id === taskId;
        });

        const timerElement = document.getElementById("timer-" + taskId);

        if (!task || !task.timerEnd || task.completed) {
            return false;
        }

        const remaining = task.timerEnd - serverNow();

        if (remaining <= 0) {

            // 5 second ke andar khatam hua = abhi live, tabhi alert/sound
            finishTimer(task, timerElement, remaining > -5000);

            return false;
        }

        if (timerElement) {
               timerElement.textContent =
    String.fromCodePoint(0x23F1) + " " + formatRemaining(remaining); 
        }

        return true;
    }

    if (tick()) {

        timerIntervals[taskId] = setInterval(function () {

            if (!tick()) {
                stopTaskTimer(taskId);
            }

        }, 1000);
    }
}


function finishTimer(task, timerElement, notify) {

    task.timeOver = true;
    task.timerEnd = null;

    if (timerElement) {
        timerElement.textContent =
    String.fromCodePoint(0x23F0) + " Time Over";
    }

    // Server me save (fail ho to bhi UI chalta rahe)
    apiRequest("time_over", { id: task.id }).catch(function (error) {
        console.error("Time over error:", error);
    });

    // Page khulne se pehle khatam hua timer chupchap mark hota hai
    if (!notify) {
        return;
    }

    playTimeOverSound();

      const message =
    String.fromCodePoint(0x23F0) + " Time over: " + task.text; 

    if ("Notification" in window && Notification.permission === "granted") {

        new Notification("TaskFlow", {
            body: message,
            requireInteraction: true
        });

    } else {

        alert(message);
    }
}


// ==========================================
// NOTIFICATION SOUND
// ==========================================

function playTimeOverSound() {

    try {

        if (!audioContext) {
            audioContext = new (window.AudioContext || window.webkitAudioContext)();
        }

        if (audioContext.state === "suspended") {
            audioContext.resume();
        }

        const oscillator = audioContext.createOscillator();
        const gain = audioContext.createGain();

        oscillator.connect(gain);
        gain.connect(audioContext.destination);

        oscillator.frequency.value = 880;
        oscillator.type = "sine";

        gain.gain.setValueAtTime(0.3, audioContext.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 1);

        oscillator.start();
        oscillator.stop(audioContext.currentTime + 1);

    } catch (error) {

        console.error("Sound error:", error);
    }
}


// ==========================================
// PRODUCTIVITY STATS
// ==========================================

function updateTaskStats() {

    const total = tasks.length;

    const completed = tasks.filter(function (task) {
        return task.completed;
    }).length;

    const pending = total - completed;

    const progress = total > 0
        ? Math.round((completed / total) * 100)
        : 0;

    const totalElement = document.getElementById("totalTasks");
    const completedElement = document.getElementById("completedTasks");
    const pendingElement = document.getElementById("pendingTasks");
    const progressElement = document.getElementById("taskProgress");

    if (totalElement) {
        totalElement.textContent = total;
    }

    if (completedElement) {
        completedElement.textContent = completed;
    }

    if (pendingElement) {
        pendingElement.textContent = pending;
    }

    if (progressElement) {
        progressElement.textContent = progress + "%";
    }
}


// ==========================================
// DARK / LIGHT MODE
// ==========================================

const themeToggle = document.getElementById("themeToggle");

if (themeToggle) {

    if (localStorage.getItem("theme") === "dark") {

        document.body.classList.add("dark-mode");

        themeToggle.textContent = String.fromCodePoint(0x2600) + " Light Mode";
    }

    themeToggle.addEventListener("click", function () {

        document.body.classList.toggle("dark-mode");

        if (document.body.classList.contains("dark-mode")) {

            localStorage.setItem("theme", "dark");

            themeToggle.textContent = "\u2600\uFE0F Light Mode";

        } else {

            localStorage.setItem("theme", "light");

            themeToggle.textContent = "\uD83C\uDF19 Dark Mode";
        }
    });
}


// ==========================================
// FEEDBACK FORM
// (abhi sirf localStorage me save hota hai - agla step)
// ==========================================

const feedbackForm = document.getElementById("feedbackForm");

if (feedbackForm) {

    feedbackForm.addEventListener("submit", function (event) {

        event.preventDefault();

        const feedbacks = JSON.parse(localStorage.getItem("feedbacks")) || [];

        feedbacks.push({
            id: Date.now(),
            type: document.getElementById("feedbackType").value,
            name: document.getElementById("feedbackName").value.trim(),
            email: document.getElementById("feedbackEmail").value.trim(),
            message: document.getElementById("feedbackMessage").value.trim(),
            date: new Date().toISOString()
        });

        localStorage.setItem("feedbacks", JSON.stringify(feedbacks));

        alert("Thank you! Your feedback has been saved.");

        feedbackForm.reset();
    });
}
