<?php
require_once 'db_connection.php';
session_start();

// Proteger sesión
if (!isset($_SESSION['username'])) {
    header("Location: ../login.php");
    exit();
}

if (isset($_GET['id'])) {
    $id_reserva = intval($_GET['id']);

    $stmt = $conn->prepare("UPDATE reservas SET estado_reserva = 'Cancelada' WHERE id_reserva = ?");
    $stmt->bind_param('i', $id_reserva);

    if ($stmt->execute()) {
        header("Location: ../G.sReservas.php?msg=cancelada");
    } else {
        header("Location: ../G.sReservas.php?msg=error");
    }
} else {
    header("Location: ../G.sReservas.php");
}
