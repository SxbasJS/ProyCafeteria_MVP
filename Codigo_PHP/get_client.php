<?php
// php/get_client.php
include 'db_connection.php';

header('Content-Type: application/json');

$codigo_universitario = isset($_GET['codigo']) ? $_GET['codigo'] : '';

if (empty($codigo_universitario)) {
    echo json_encode(['success' => false, 'message' => 'Código universitario no proporcionado.']);
    $conn->close();
    exit();
}

$stmt = $conn->prepare("SELECT id_cliente, nombre, apellido FROM clientes WHERE codigo_universitario = ?");
$stmt->bind_param("s", $codigo_universitario);
$stmt->execute();
$result = $stmt->get_result();

if ($result->num_rows > 0) {
    $client = $result->fetch_assoc();
    echo json_encode(['success' => true, 'client' => $client]);
} else {
    echo json_encode(['success' => false, 'message' => 'Código universitario no encontrado.']);
}

$stmt->close();
$conn->close();
?>