<?php
// php/get_categories.php
include 'db_connection.php'; // Incluye tu archivo de conexión

header('Content-Type: application/json');

$sql = "SELECT id_categoria, nombre_categoria FROM categorias ORDER BY nombre_categoria";
$result = $conn->query($sql);

$categories = array();
if ($result->num_rows > 0) {
    while($row = $result->fetch_assoc()) {
        $categories[] = $row;
    }
}

echo json_encode($categories);

$conn->close();
?>