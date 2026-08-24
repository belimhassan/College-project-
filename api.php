<?php

header("Content-Type: application/json");

$host = "localhost";
$user = "root";
$password = "";
$database = "todo_list";

$conn = new mysqli(
    $host,
    $user,
    $password,
    $database
);

if ($conn->connect_error) {

    echo json_encode([
        "success" => false,
        "message" => "Database connection failed"
    ]);

    exit;
}

$conn->set_charset("utf8mb4");


// ================================
// REGISTER
// ================================

if ($_SERVER["REQUEST_METHOD"] === "POST") {

    $action = $_POST["action"] ?? "";


    if ($action === "register") {

        $name = trim($_POST["name"] ?? "");
        $username = trim($_POST["username"] ?? "");
        $email = trim($_POST["email"] ?? "");
        $password = $_POST["password"] ?? "";


        if (
            $name === "" ||
            $username === "" ||
            $email === "" ||
            $password === ""
        ) {

            echo json_encode([
                "success" => false,
                "message" => "Please fill all fields."
            ]);

            exit;
        }


        if (strlen($password) < 6) {

            echo json_encode([
                "success" => false,
                "message" => "Password must be at least 6 characters."
            ]);

            exit;
        }


        // Check username or email

        $check = $conn->prepare(
            "SELECT id FROM users
             WHERE username = ? OR email = ?"
        );

        $check->bind_param(
            "ss",
            $username,
            $email
        );

        $check->execute();

        $result = $check->get_result();


        if ($result->num_rows > 0) {

            echo json_encode([
                "success" => false,
                "message" => "Username or email already exists."
            ]);

            exit;
        }


        // Secure password

        $hashedPassword =
            password_hash(
                $password,
                PASSWORD_DEFAULT
            );


        // Insert user

        $stmt = $conn->prepare(
            "INSERT INTO users
            (name, username, email, password)
            VALUES (?, ?, ?, ?)"
        );

        $stmt->bind_param(
            "ssss",
            $name,
            $username,
            $email,
            $hashedPassword
        );


        if ($stmt->execute()) {

            echo json_encode([
                "success" => true,
                "message" => "Registration successful."
            ]);

        } else {

            echo json_encode([
                "success" => false,
                "message" => "Registration failed."
            ]);

        }

        exit;
    }


    echo json_encode([
        "success" => false,
        "message" => "Invalid action."
    ]);

    exit;
}


echo json_encode([
    "success" => false,
    "message" => "Invalid request."
]);

?>