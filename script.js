
function getUsers() {

    let data = localStorage.getItem("users");

    if (data) {
        return JSON.parse(data);
    }

    return [];
}


function saveUsers(users) {

    localStorage.setItem(
        "users",
        JSON.stringify(users)
    );
}


function getLoggedInUser() {

    let data =
        localStorage.getItem("loggedInUser");

    if (data) {
        return JSON.parse(data);
    }

    return null;
}


// ==========================================
// REGISTER
// ==========================================

let registerForm =
    document.getElementById("registerForm");


if (registerForm) {

    registerForm.addEventListener(
        "submit",
        function(event) {

            event.preventDefault();


            let name =
                document.getElementById("name")
                .value
                .trim();


            let username =
                document.getElementById("username")
                .value
                .trim()
                .toLowerCase();


            let email =
                document.getElementById("email")
                .value
                .trim()
                .toLowerCase();


            let password =
                document.getElementById("password")
                .value;


            let confirmPassword =
                document.getElementById("confirm")
                .value;


            // Check empty fields

            if (
                name === "" ||
                username === "" ||
                email === "" ||
                password === "" ||
                confirmPassword === ""
            ) {

                alert(
                    "Please fill all fields."
                );

                return;
            }


            // Password length

            if (password.length < 6) {

                alert(
                    "Password must be at least 6 characters."
                );

                return;
            }


            // Password confirmation

            if (password !== confirmPassword) {

                alert(
                    "Passwords do not match."
                );

                return;
            }


            let users = getUsers();


            // Check username

            let usernameExists =
                users.find(
                    function(user) {

                        return (
                            user.username ===
                            username
                        );

                    }
                );


            if (usernameExists) {

                alert(
                    "Username already exists."
                );

                return;
            }


            // Check email

            let emailExists =
                users.find(
                    function(user) {

                        return (
                            user.email ===
                            email
                        );

                    }
                );


            if (emailExists) {

                alert(
                    "Email already registered."
                );

                return;
            }


            // Create new user

            let newUser = {

                id: Date.now(),

                name: name,

                username: username,

                email: email,

                password: password

            };


            users.push(newUser);


            saveUsers(users);


            alert(
                "Registration successful!"
            );


            // Go to Login

            window.location.href =
                "index.html";

        }
    );
}


// ==========================================
// LOGIN
// ==========================================

let loginForm =
    document.getElementById("loginForm");


if (loginForm) {

    loginForm.addEventListener(
        "submit",
        function(event) {

            event.preventDefault();


            let username =
                document.getElementById("username")
                .value
                .trim()
                .toLowerCase();


            let password =
                document.getElementById("password")
                .value;


            // Empty fields

            if (
                username === "" ||
                password === ""
            ) {

                alert(
                    "Please enter username and password."
                );

                return;
            }


            let users = getUsers();


            // Find matching user

            let user =
                users.find(
                    function(item) {

                        return (
                            item.username ===
                            username &&
                            item.password ===
                            password
                        );

                    }
                );


            // User not found

            if (!user) {

                alert(
                    "Invalid username or password."
                );

                return;
            }


            // Save logged in user

            localStorage.setItem(
                "loggedInUser",
                JSON.stringify(user)
            );


            alert(
                "Login successful!"
            );


            // Open Dashboard

            window.location.href =
                "dashboard.html";

        }
    );
}


// ==========================================
// DASHBOARD LOGIN CHECK
// ==========================================

if (
    window.location.pathname.endsWith(
        "dashboard.html"
    )
) {

    let loggedInUser =
        getLoggedInUser();


    if (!loggedInUser) {

        window.location.href =
            "index.html";

    }
}


// ==========================================
// SHOW USER NAME ON DASHBOARD
// ==========================================

let currentUser =
    getLoggedInUser();


let welcomeMessage =
    document.getElementById(
        "welcomeMessage"
    );


let userName =
    document.getElementById(
        "userName"
    );


let welcomeName =
    document.getElementById(
        "welcomeName"
    );


if (currentUser) {

    if (welcomeMessage) {

        welcomeMessage.textContent =
            "Welcome, " +
            currentUser.name +
            "!";
    }


    if (userName) {

        userName.textContent =
            currentUser.name;

    }


    if (welcomeName) {

        welcomeName.textContent =
            currentUser.name;

    }
}


// ==========================================
// LOGOUT
// ==========================================

let logoutBtn =
    document.getElementById(
        "logoutBtn"
    );


if (logoutBtn) {

    logoutBtn.addEventListener(
        "click",
        function() {

            localStorage.removeItem(
                "loggedInUser"
            );


            window.location.href =
                "index.html";

        }
    );
}


// ==========================================
// TODO LIST
// ==========================================


// Get tasks of current user

function getTasks() {

    let user =
        getLoggedInUser();


    if (!user) {
        return [];
    }


    let allTasks =
        JSON.parse(
            localStorage.getItem("tasks")
        ) || {};


    if (!allTasks[user.username]) {

        return [];

    }


    return allTasks[user.username];

}


// Save tasks

function saveTasks(tasks) {

    let user =
        getLoggedInUser();


    if (!user) {
        return;
    }


    let allTasks =
        JSON.parse(
            localStorage.getItem("tasks")
        ) || {};


    allTasks[user.username] =
        tasks;


    localStorage.setItem(
        "tasks",
        JSON.stringify(allTasks)
    );

}


// ==========================================
// ADD TASK
// ==========================================

let taskInput =
    document.getElementById(
        "taskInput"
    );


let addTaskBtn =
    document.getElementById(
        "addTaskBtn"
    );


let taskList =
    document.getElementById(
        "taskList"
    );


function addTask() {

    if (!taskInput) {
        return;
    }


    let taskText =
        taskInput.value.trim();


    if (taskText === "") {

        alert(
            "Please enter a task."
        );

        return;
    }


    let tasks =
        getTasks();
  let durationSelect =
    document.getElementById("taskDuration");

if (
    !durationSelect ||
    durationSelect.value === ""
) {

    alert("Please select task duration.");

    return;
}

let duration = durationSelect
    ? Number(durationSelect.value)
    : 5;
     let prioritySelect =
    document.getElementById("taskPriority");

let priority =
    prioritySelect
        ? prioritySelect.value
        : "medium";



let dueDateInput =
    document.getElementById("taskDueDate");

let newTask = {

    id: Date.now(),

    text: taskText,

    completed: false,

    duration: duration || 5,

    priority: priority,

    dueDate: dueDateInput
        ? dueDateInput.value
        : "",

    timeOver: false

};


   


    tasks.push(newTask);


    saveTasks(tasks);


    taskInput.value = "";


    displayTasks();
    startTaskTimer(newTask.id);

}


if (addTaskBtn) {

    addTaskBtn.addEventListener(
        "click",
        addTask
    );

}


// Add task using Enter key

if (taskInput) {

    taskInput.addEventListener(
        "keydown",
        function(event) {

            if (event.key === "Enter") {

                addTask();

            }

        }
    );

}


// ==========================================
// DISPLAY TASKS
// ==========================================

function displayTasks() {

    if (!taskList) {
        return;
    }


    let tasks =
        getTasks();


    taskList.innerHTML = "";


    if (tasks.length === 0) {

        taskList.innerHTML =
            "<li>No tasks yet.</li>";

        return;
    }


    tasks.forEach(
        function(task) {


            let li =
                document.createElement("li");


            li.className =
                "task-item";


            if (task.completed) {

                li.classList.add(
                    "completed"
                );

            }


            let leftSide =
                document.createElement("div");


            let checkbox =
                document.createElement(
                    "input"
                );


            checkbox.type =
                "checkbox";


            checkbox.checked =
                task.completed;


            checkbox.addEventListener(
                "change",
                function() {

                    toggleTask(
                        task.id
                    );
                    displayTasks();
                    updateTaskStats();

                }
            );


            let text =
                document.createElement(
                    "span"
                );


            text.textContent =
                task.text;
            
            let priority =
    document.createElement("small");

priority.textContent =
    task.priority === "high"
        ? " 🔴 High"
        : task.priority === "low"
        ? " 🟢 Low"
        : " 🟡 Medium";

priority.className =
    "task-priority";

leftSide.appendChild(
    priority
);
            let dueDate =
    document.createElement("small");

if (task.dueDate) {

    dueDate.textContent =
        " 📅 " + task.dueDate;

    dueDate.className =
        "task-due-date";

    leftSide.appendChild(
        dueDate
    );
}

            leftSide.appendChild(
                checkbox
            );


            leftSide.appendChild(
                text
            );


            let editButton =
                document.createElement(
                    "button"
                );


            editButton.textContent =
                "Edit";


            editButton.addEventListener(
                "click",
                function() {

                    editTask(
                        task.id
                    );

                }
            );


            let deleteButton =
                document.createElement(
                    "button"
                );


            deleteButton.textContent =
                "Delete";


            deleteButton.addEventListener(
                "click",
                function() {

                    deleteTask(
                        task.id
                    );

                }
            );


            let buttons =
                document.createElement(
                    "div"
                );


            buttons.appendChild(
                editButton
            );


            buttons.appendChild(
                deleteButton
            );
    li.appendChild(
    leftSide
);


let timerElement =
    document.createElement("span");


timerElement.id =
    "timer-" + task.id;


timerElement.className =
    "task-timer";


timerElement.textContent =
    "Starting...";


li.appendChild(
    timerElement
);


li.appendChild(
    buttons
);


taskList.appendChild(
    li
);

if (task.timeOver) {

    timerElement.textContent =
        "⏰ Time Over";

} else if (
    localStorage.getItem(
        "taskTimer_" + task.id
    )
) {

    runTaskTimer(
        task.id
    );

}

        }
    );

}


// ==========================================
// COMPLETE / UNCOMPLETE TASK
// ==========================================

function toggleTask(id) {

    let tasks =
        getTasks();


    let task =
        tasks.find(
            function(item) {

                return item.id === id;

            }
        );


    if (!task) {
        return;
    }


    task.completed =
        !task.completed;


    saveTasks(tasks);


    displayTasks();

}


// ==========================================
// EDIT TASK
// ==========================================

function editTask(id) {

    let tasks =
        getTasks();


    let task =
        tasks.find(
            function(item) {

                return item.id === id;

            }
        );


    if (!task) {
        return;
    }


    let newText =
        prompt(
            "Edit your task:",
            task.text
        );


    if (
        newText === null ||
        newText.trim() === ""
    ) {

        return;

    }


    task.text =
        newText.trim();


    saveTasks(tasks);


    displayTasks();

}


// ==========================================
// DELETE TASK
// ==========================================

function deleteTask(id) {

    let answer =
        confirm(
            "Do you want to delete this task?"
        );


    if (!answer) {
        return;
    }


    let tasks =
        getTasks();


    tasks =
        tasks.filter(
            function(task) {

                return task.id !== id;

            }
        );


    saveTasks(tasks);


    displayTasks();

}


// ==========================================
// LOAD TASKS
// ==========================================

displayTasks();
updateTaskStats();

// ==========================================
// TASK TIMER
// ==========================================

let timerIntervals = {};


function startTaskTimer(taskId) {

    let tasks = getTasks();


    let task = tasks.find(
        function(item) {

            return item.id === taskId;

        }
    );


    if (!task) {
        return;
    }


    let duration =
        Number(task.duration || 5);


    let endTime =
        Date.now() +
        (duration * 60 * 1000);


    localStorage.setItem(
        "taskTimer_" + taskId,
        endTime
    );


    runTaskTimer(
        taskId
    );

}


function runTaskTimer(taskId) {

    if (timerIntervals[taskId]) {

        clearInterval(
            timerIntervals[taskId]
        );

    }


    function updateTimer() {

        let endTime =
            Number(
                localStorage.getItem(
                    "taskTimer_" + taskId
                )
            );


        if (!endTime) {
            return;
        }


        let remaining =
            endTime - Date.now();


        let timerElement =
            document.getElementById(
                "timer-" + taskId
            );


        if (remaining <= 0) {

            if (timerElement) {

                timerElement.textContent =
                    "⏰ Your time is over!";
                let tasks = getTasks();
            }

let task = tasks.find(function(item) {
    return item.id === taskId;
});

if (task) {

    task.timeOver = true;

    saveTasks(tasks);



            }


            clearInterval(
                timerIntervals[taskId]
            );
            

            localStorage.removeItem(
                "taskTimer_" + taskId
            );
              // 🔊 Play sound
    playTimeOverSound();

            if (
                "Notification" in window &&
                Notification.permission === "granted"
            ) {

                new Notification(
                    "TaskFlow",
                    {
                        body:
                            "⏰ Your time is over!",
                        requireInteraction: true
                    }
                );

            } else {

                alert(
                    "⏰ Your time is over!"
                );

            }


            return;
        }


        let totalSeconds =
            Math.floor(
                remaining / 1000
            );


        let hours =
            Math.floor(
                totalSeconds / 3600
            );


        let minutes =
            Math.floor(
                (totalSeconds % 3600) / 60
            );


        let seconds =
            totalSeconds % 60;


        let timeText;


        if (hours > 0) {

            timeText =
                hours + "h " +
                minutes + "m " +
                seconds + "s";

        } else {

            timeText =
                minutes + "m " +
                seconds + "s";

        }


        if (timerElement) {

            timerElement.textContent =
                "⏱️ " + timeText;

        }

    }


    updateTimer();


    timerIntervals[taskId] =
        setInterval(
            updateTimer,
            1000
        );

}
if (
    "Notification" in window &&
    Notification.permission === "default"
) {
    Notification.requestPermission();
}
// ==========================================
// NOTIFICATION SOUND
// ==========================================

function playTimeOverSound() {

    const audioContext =
        new (window.AudioContext ||
        window.webkitAudioContext)();

    const oscillator =
        audioContext.createOscillator();

    const gain =
        audioContext.createGain();

    oscillator.connect(gain);

    gain.connect(
        audioContext.destination
    );

    oscillator.frequency.value = 880;

    oscillator.type = "sine";

    gain.gain.setValueAtTime(
        0.3,
        audioContext.currentTime
    );

    gain.gain.exponentialRampToValueAtTime(
        0.01,
        audioContext.currentTime + 1
    );

    oscillator.start();

    oscillator.stop(
        audioContext.currentTime + 1
    );
}
// ==========================================
// PRODUCTIVITY STATS
// ==========================================

function updateTaskStats() {

    let tasks = getTasks();

    let total =
        tasks.length;

    let completed =
        tasks.filter(function(task) {
            return task.completed;
        }).length;

    let pending =
        total - completed;

    let progress = 0;

    if (total > 0) {
        progress =
            Math.round(
                (completed / total) * 100
            );
    }

    let totalElement =
        document.getElementById("totalTasks");

    let completedElement =
        document.getElementById("completedTasks");

    let pendingElement =
        document.getElementById("pendingTasks");

    let progressElement =
        document.getElementById("taskProgress");


    if (totalElement) {
        totalElement.textContent =
            total;
    }

    if (completedElement) {
        completedElement.textContent =
            completed;
    }

    if (pendingElement) {
        pendingElement.textContent =
            pending;
    }

    if (progressElement) {
        progressElement.textContent =
            progress + "%";
    }
}


// Update stats when dashboard loads
updateTaskStats();
// ==========================================
// DARK / LIGHT MODE
// ==========================================

const themeToggle = document.getElementById("themeToggle");


// Load saved theme
// Load saved theme
if (
    localStorage.getItem("theme") === "dark" &&
    themeToggle
) {

    document.body.classList.add("dark-mode");

    themeToggle.textContent = "☀️ Light Mode";

}


// Toggle theme

// Toggle theme
if (themeToggle) {

    themeToggle.addEventListener("click", function () {

        document.body.classList.toggle("dark-mode");

        if (document.body.classList.contains("dark-mode")) {

            localStorage.setItem("theme", "dark");

            themeToggle.textContent = "☀️ Light Mode";

        } else {

            localStorage.setItem("theme", "light");

            themeToggle.textContent = "🌙 Dark Mode";

        }

    });

}
