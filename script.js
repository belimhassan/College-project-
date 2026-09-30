// ==========================================
// COMMON HELPERS (sab data localStorage me)
// ==========================================

const taskList = document.getElementById("taskList");
const isDashboardPage = !!taskList;

const USERS_KEY = "taskflow_users";
const CURRENT_USER_KEY = "taskflow_current_user";

function getUsers() {
    return JSON.parse(localStorage.getItem(USERS_KEY)) || [];
}

function saveUsers(users) {
    localStorage.setItem(USERS_KEY, JSON.stringify(users));
}

function getCurrentUser() {
    return JSON.parse(localStorage.getItem(CURRENT_USER_KEY));
}

function saveCurrentUser(user) {
    localStorage.setItem(CURRENT_USER_KEY, JSON.stringify(user));
}

function getTasksKey() {
    const user = getCurrentUser();
    return user ? "taskflow_tasks_" + user.username : null;
}

function getStoredTasks() {
    const key = getTasksKey();
    return key ? JSON.parse(localStorage.getItem(key)) || [] : [];
}

function saveStoredTasks(list) {
    const key = getTasksKey();
    if (key) {
        localStorage.setItem(key, JSON.stringify(list));
    }
}

// Aaj ki date "YYYY-MM-DD" (local time) - date input se compare karne ke liye
function todayString() {
    const now = new Date();
    const month = String(now.getMonth() + 1).padStart(2, "0");
    const day = String(now.getDate()).padStart(2, "0");
    return now.getFullYear() + "-" + month + "-" + day;
}

// ---- Password hashing (plain password ab save nahi hota) ----

function bytesToHex(bytes) {
    return Array.from(bytes, function (b) {
        return b.toString(16).padStart(2, "0");
    }).join("");
}

function generateSalt() {
    return bytesToHex(crypto.getRandomValues(new Uint8Array(16)));
}

async function hashPassword(password, salt) {
    const data = new TextEncoder().encode(salt + ":" + password);
    const digest = await crypto.subtle.digest("SHA-256", data);
    return bytesToHex(new Uint8Array(digest));
}

// Username + password check. Purane account (plain password) pehli
// login par automatically hashed format me upgrade ho jate hain.
async function verifyLogin(username, password) {

    const users = getUsers();

    const user = users.find(function (item) {
        return item.username === username;
    });

    if (!user) {
        return null;
    }

    if (user.passwordHash) {
        const hash = await hashPassword(password, user.salt);
        return hash === user.passwordHash ? user : null;
    }

    if (user.password !== undefined && user.password === password) {
        user.salt = generateSalt();
        user.passwordHash = await hashPassword(password, user.salt);
        delete user.password;
        saveUsers(users);
        return user;
    }

    return null;
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

        const users = getUsers();

        const usernameExists = users.some(function (user) {
            return user.username === username;
        });

        const emailExists = users.some(function (user) {
            return user.email === email;
        });

        if (usernameExists) {
            alert("Username already exists.");
            return;
        }

        if (emailExists) {
            alert("Email already registered.");
            return;
        }

        let salt;
        let passwordHash;

        try {
            salt = generateSalt();
            passwordHash = await hashPassword(password, salt);
        } catch (error) {
            console.error("Hash error:", error);
            alert("Could not secure your password. Please open the site over https.");
            return;
        }

        users.push({
            id: Date.now(),
            name: name,
            username: username,
            email: email,
            salt: salt,
            passwordHash: passwordHash
        });

        saveUsers(users);

        alert("Registration successful!");

        window.location.href = "index.html";
    });
}


// ==========================================
// LOGIN
// ==========================================

const loginForm = document.getElementById("loginForm");

if (loginForm) {

    // Pehle se login hai to seedha dashboard
    if (getCurrentUser()) {
        window.location.href = "dashboard.html";
    }

    loginForm.addEventListener("submit", async function (event) {

        event.preventDefault();

        const username = document.getElementById("username").value.trim().toLowerCase();
        const password = document.getElementById("password").value;

        if (username === "" || password === "") {
            alert("Please enter username and password.");
            return;
        }

        let user = null;

        try {
            user = await verifyLogin(username, password);
        } catch (error) {
            console.error("Login error:", error);
            alert("Could not verify password. Please open the site over https.");
            return;
        }

        if (!user) {
            alert("Invalid username or password.");
            return;
        }

        // password current user me save nahi karte
        saveCurrentUser({
            id: user.id,
            name: user.name,
            username: user.username,
            email: user.email
        });

        window.location.href = "dashboard.html";
    });
}


// ==========================================
// FORGOT PASSWORD (username + email match hone par reset)
// ==========================================

const resetForm = document.getElementById("resetForm");
const forgotLink = document.getElementById("forgotLink");
const cancelResetBtn = document.getElementById("cancelReset");

if (loginForm && resetForm && forgotLink) {

    function showLoginForm() {
        resetForm.reset();
        resetForm.hidden = true;
        loginForm.hidden = false;
    }

    forgotLink.addEventListener("click", function (event) {

        event.preventDefault();

        loginForm.hidden = true;
        resetForm.hidden = false;

        document.getElementById("resetUsername").focus();
    });

    if (cancelResetBtn) {
        cancelResetBtn.addEventListener("click", showLoginForm);
    }

    resetForm.addEventListener("submit", async function (event) {

        event.preventDefault();

        const username = document.getElementById("resetUsername").value.trim().toLowerCase();
        const email = document.getElementById("resetEmail").value.trim().toLowerCase();
        const newPassword = document.getElementById("resetPassword").value;
        const confirmPassword = document.getElementById("resetConfirm").value;

        if (newPassword.length < 6) {
            alert("Password must be at least 6 characters.");
            return;
        }

        if (newPassword !== confirmPassword) {
            alert("Passwords do not match.");
            return;
        }

        const users = getUsers();

        const user = users.find(function (item) {
            return item.username === username && item.email === email;
        });

        if (!user) {
            alert("No account found with this username and email.");
            return;
        }

        try {
            user.salt = generateSalt();
            user.passwordHash = await hashPassword(newPassword, user.salt);
            delete user.password;
        } catch (error) {
            console.error("Hash error:", error);
            alert("Could not secure your password. Please open the site over https.");
            return;
        }

        saveUsers(users);

        alert("Password changed! Please login with your new password.");

        showLoginForm();
    });
}


// ==========================================
// DASHBOARD STATE
// ==========================================

let tasks = [];
let timerIntervals = {};
let audioContext = null;
let editingTaskId = null;   // jo task abhi edit ho raha hai
let missedTimers = [];      // page band hone par khatam hue timers

const PRIORITY_LABELS = {
    high: String.fromCodePoint(0x1F534) + " High",
    medium: String.fromCodePoint(0x1F7E1) + " Medium",
    low: String.fromCodePoint(0x1F7E2) + " Low"
};


// ==========================================
// DASHBOARD INIT (login check + welcome)
// ==========================================

function initDashboard() {

    const me = getCurrentUser();

    if (!me) {
        window.location.href = "index.html";
        return;
    }

    const welcomeMessage = document.getElementById("welcomeMessage");
    const userName = document.getElementById("userName");
    const welcomeName = document.getElementById("welcomeName");

    if (welcomeMessage) {
        welcomeMessage.textContent = "Welcome, " + me.name + "!";
    }

    if (userName) {
        userName.textContent = me.name;
    }

    if (welcomeName) {
        welcomeName.textContent = me.name;
    }

    // Purani date select na ho sake
    const dueDateInput = document.getElementById("taskDueDate");

    if (dueDateInput) {
        dueDateInput.min = todayString();
    }

    loadTasks();
}

if (isDashboardPage) {
    initDashboard();
}


// ==========================================
// LOGOUT
// ==========================================

const logoutBtn = document.getElementById("logoutBtn");

if (logoutBtn) {

    logoutBtn.addEventListener("click", function () {

        localStorage.removeItem(CURRENT_USER_KEY);

        window.location.href = "index.html";
    });
}


// ==========================================
// LOAD TASKS (localStorage se)
// ==========================================

function loadTasks() {

    tasks = getStoredTasks();

    displayTasks();
    updateTaskStats();
}


// ==========================================
// ADD TASK
// ==========================================

const taskInput = document.getElementById("taskInput");
const addTaskBtn = document.getElementById("addTaskBtn");


function addTask() {

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

    if (dueDateInput && dueDateInput.value !== "" && dueDateInput.value < todayString()) {
        alert("Due date cannot be in the past.");
        return;
    }

    // Notification permission user click par maangte hain
    if ("Notification" in window && Notification.permission === "default") {
        Notification.requestPermission();
    }

    // NOTE: duration ki value MINUTES me maani gayi hai (jaise 5, 30, 60)
    const minutes = parseFloat(durationSelect.value);

    const newTask = {
        id: Date.now(),
        text: taskText,
        priority: prioritySelect ? prioritySelect.value : "medium",
        dueDate: dueDateInput ? dueDateInput.value : "",
        completed: false,
        timeOver: false,
        timerEnd: isNaN(minutes) ? null : Date.now() + minutes * 60 * 1000
    };

    const list = getStoredTasks();

    list.push(newTask);
    saveStoredTasks(list);

    // Form wapas default par
    taskInput.value = "";
    durationSelect.value = "";

    if (prioritySelect) {
        prioritySelect.value = "medium";
    }

    if (dueDateInput) {
        dueDateInput.value = "";
    }

    loadTasks();
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

    missedTimers = [];

    if (tasks.length === 0) {
        taskList.innerHTML = "<li>No tasks yet.</li>";
        return;
    }

    const today = todayString();
    let focusElement = null;

    tasks.forEach(function (task) {

        const li = document.createElement("li");

        li.className = "task-item";

        if (task.completed) {
            li.classList.add("completed");
        }

        const leftSide = document.createElement("div");
        const buttons = document.createElement("div");

        buttons.className = "task-buttons";

        if (task.id === editingTaskId) {

            // ---- edit mode: text, priority, due date ----

            leftSide.className = "edit-row";

            const textInput = document.createElement("input");

            textInput.type = "text";
            textInput.value = task.text;
            textInput.className = "edit-text";

            const prioritySelect = document.createElement("select");

            Object.keys(PRIORITY_LABELS).forEach(function (value) {

                const option = document.createElement("option");

                option.value = value;
                option.textContent = PRIORITY_LABELS[value];

                prioritySelect.appendChild(option);
            });

            prioritySelect.value = task.priority || "medium";

            const dateInput = document.createElement("input");

            dateInput.type = "date";
            dateInput.value = task.dueDate || "";

            const saveButton = document.createElement("button");

            saveButton.textContent = "Save";
            saveButton.className = "task-btn btn-save";

            const cancelButton = document.createElement("button");

            cancelButton.textContent = "Cancel";
            cancelButton.className = "task-btn btn-cancel";

            function save() {
                saveEdit(task.id, textInput.value, prioritySelect.value, dateInput.value);
            }

            saveButton.addEventListener("click", save);
            cancelButton.addEventListener("click", cancelEdit);

            textInput.addEventListener("keydown", function (event) {

                if (event.key === "Enter") {
                    save();
                } else if (event.key === "Escape") {
                    cancelEdit();
                }
            });

            leftSide.appendChild(textInput);
            leftSide.appendChild(prioritySelect);
            leftSide.appendChild(dateInput);

            buttons.appendChild(saveButton);
            buttons.appendChild(cancelButton);

            focusElement = textInput;

        } else {

            // ---- normal mode: checkbox, text, priority, due date ----

            const checkbox = document.createElement("input");

            checkbox.type = "checkbox";
            checkbox.checked = task.completed;

            checkbox.addEventListener("change", function () {
                toggleTask(task.id);
            });

            const text = document.createElement("span");

            text.textContent = task.text;
            text.className = "task-text";

            const priority = document.createElement("small");

            priority.textContent =
                " " + (PRIORITY_LABELS[task.priority] || PRIORITY_LABELS.medium);

            priority.className = "task-priority";

            leftSide.appendChild(checkbox);
            leftSide.appendChild(text);
            leftSide.appendChild(priority);

            if (task.dueDate) {

                const dueDate = document.createElement("small");

                dueDate.textContent = " \uD83D\uDCC5 " + task.dueDate;
                dueDate.className = "task-due-date";

                leftSide.appendChild(dueDate);

                // Due date nikal gayi aur task complete nahi
                if (!task.completed && task.dueDate < today) {

                    const overdue = document.createElement("small");

                    overdue.textContent = "\u26A0\uFE0F Overdue";
                    overdue.className = "task-overdue";

                    leftSide.appendChild(overdue);
                }
            }

            const editButton = document.createElement("button");

            editButton.textContent = "Edit";
            editButton.className = "task-btn btn-edit";

            editButton.addEventListener("click", function () {
                editTask(task.id);
            });

            const deleteButton = document.createElement("button");

            deleteButton.textContent = "Delete";
            deleteButton.className = "task-btn btn-delete";

            deleteButton.addEventListener("click", function () {
                deleteTask(task.id);
            });

            buttons.appendChild(editButton);
            buttons.appendChild(deleteButton);
        }

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

    if (missedTimers.length > 0) {
        showTimeoutBanner(missedTimers);
    }

    if (focusElement) {
        focusElement.focus();
    }
}


// Page band tha aur timer khatam ho gaya - user ko batate hain
function showTimeoutBanner(names) {

    let banner = document.getElementById("timeoutBanner");

    if (!banner) {

        banner = document.createElement("div");

        banner.id = "timeoutBanner";
        banner.className = "timeout-banner";

        taskList.parentNode.insertBefore(banner, taskList);
    }

    banner.innerHTML = "";

    const message = document.createElement("span");

    message.textContent =
        "\u23F0 Time ran out while you were away: " + names.join(", ");

    const closeButton = document.createElement("button");

    closeButton.type = "button";
    closeButton.textContent = "\u2715";
    closeButton.setAttribute("aria-label", "Close");

    closeButton.addEventListener("click", function () {
        banner.remove();
    });

    banner.appendChild(message);
    banner.appendChild(closeButton);
}


// ==========================================
// COMPLETE / UNCOMPLETE TASK
// ==========================================

function toggleTask(id) {

    const list = getStoredTasks();

    const task = list.find(function (item) {
        return item.id === id;
    });

    if (task) {
        task.completed = !task.completed;
        saveStoredTasks(list);
    }

    loadTasks();
}


// ==========================================
// EDIT TASK
// ==========================================

function editTask(id) {

    editingTaskId = id;

    displayTasks();
}


function cancelEdit() {

    editingTaskId = null;

    displayTasks();
}


function saveEdit(id, newText, newPriority, newDueDate) {

    const text = newText.trim();

    if (text === "") {
        alert("Task text cannot be empty.");
        return;
    }

    const list = getStoredTasks();

    const task = list.find(function (item) {
        return item.id === id;
    });

    if (task) {

        task.text = text;
        task.priority = newPriority;
        task.dueDate = newDueDate;

        saveStoredTasks(list);
    }

    editingTaskId = null;

    loadTasks();
}


// ==========================================
// DELETE TASK
// ==========================================

function deleteTask(id) {

    if (!confirm("Do you want to delete this task?")) {
        return;
    }

    if (editingTaskId === id) {
        editingTaskId = null;
    }

    const list = getStoredTasks().filter(function (item) {
        return item.id !== id;
    });

    saveStoredTasks(list);

    loadTasks();
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

        const remaining = task.timerEnd - Date.now();

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

    // localStorage me save
    const list = getStoredTasks();

    const stored = list.find(function (item) {
        return item.id === task.id;
    });

    if (stored) {
        stored.timeOver = true;
        stored.timerEnd = null;
        saveStoredTasks(list);
    }

    // Page khulne se pehle khatam hua timer chupchap mark hota hai
    if (!notify) {
        missedTimers.push(task.text);
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

        themeToggle.textContent = "\u2600\uFE0F Light Mode";
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
// FEEDBACK FORM (localStorage me save)
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
