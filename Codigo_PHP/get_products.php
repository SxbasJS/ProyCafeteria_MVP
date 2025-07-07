<?php
// php/get_products.php
include 'db_connection.php'; // Incluye tu archivo de conexión

header('Content-Type: application/json');

$categoryId = isset($_GET['category_id']) ? intval($_GET['category_id']) : 0;

$sql = "SELECT id_producto, nombre_producto, descripcion, precio, stock_actual, imagen_url FROM productos ";
if ($categoryId > 0) {
    $sql .= "WHERE id_categoria = " . $categoryId;
}
$sql .= " ORDER BY nombre_producto";

$result = $conn->query($sql);

$products = array();
if ($result->num_rows > 0) {
    while($row = $result->fetch_assoc()) {
        $products[] = $row;
    }
}

echo json_encode($products);

$conn->close();
?>