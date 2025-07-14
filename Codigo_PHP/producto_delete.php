<?php
require_once 'db_connection.php';
session_start();

if (!isset($_SESSION['username'])) {
    header("Location: ../login.php");
    exit();
}

if (isset($_GET['id'])) {
    $id = intval($_GET['id']);
    $stmt = $conn->prepare("DELETE FROM productos WHERE id_producto = ?");
    $stmt->bind_param('i', $id);
    $stmt->execute();
}

header("Location: ../G.sProductos.php");
exit();
