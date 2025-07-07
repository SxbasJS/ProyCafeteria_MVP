<?php
session_start();
require_once 'db_connection.php';

if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    $username = trim($_POST['username']);
    $password = trim($_POST['password']);

    if ($username === '' || $password === '') {
        header("Location: ../login.php?error=Campos+obligatorios");
        exit();
    }

    $stmt = $conn->prepare("SELECT * FROM usuarios_admin WHERE username = ?");
    $stmt->bind_param("s", $username);
    $stmt->execute();
    $result = $stmt->get_result();

    if ($result && $result->num_rows === 1) {
        $user = $result->fetch_assoc();
        if ($password === $user['password']) {
            $_SESSION['id_usuario'] = $user['id_usuario'];
            $_SESSION['username'] = $user['username'];
            $_SESSION['nombre'] = $user['nombre'];
            $_SESSION['rol'] = $user['rol'];
            header("Location: ../admin.html");
            exit();
        } else {
            header("Location: ../login.php?error=Contraseña+incorrecta");
            exit();
        }
    } else {
        header("Location: ../login.php?error=Usuario+no+encontrado");
        exit();
    }
} else {
    header("Location: ../login.php");
    exit();
}
