<?php
require_once 'db_connection.php';
session_start();

if (!isset($_SESSION['username'])) {
    header("Location: ../login.php");
    exit();
}

$modo = "Nuevo Producto";
$id_producto = 0;
$nombre = "";
$descripcion = "";
$precio = "";
$id_categoria = "";
$stock_actual = "";
$imagen_url = "";

if (isset($_GET['id'])) {
    $id_producto = intval($_GET['id']);
    $stmt = $conn->prepare("SELECT * FROM productos WHERE id_producto = ?");
    $stmt->bind_param('i', $id_producto);
    $stmt->execute();
    $res = $stmt->get_result();
    if ($row = $res->fetch_assoc()) {
        $modo = "Editar Producto";
        $nombre = $row['nombre_producto'];
        $descripcion = $row['descripcion'];
        $precio = $row['precio'];
        $id_categoria = $row['id_categoria'];
        $stock_actual = $row['stock_actual'];
        $imagen_url = $row['imagen_url'];
    }
}

if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    $id_producto = intval($_POST['id_producto']);
    $nombre = $_POST['nombre'];
    $descripcion = $_POST['descripcion'];
    $precio = $_POST['precio'];
    $id_categoria = $_POST['id_categoria'];
    $stock_actual = $_POST['stock_actual'];
    $imagen_url = $_POST['imagen_url'];

    if ($id_producto > 0) {
        $stmt = $conn->prepare("UPDATE productos SET nombre_producto=?, descripcion=?, precio=?, id_categoria=?, stock_actual=?, imagen_url=? WHERE id_producto=?");
        $stmt->bind_param('ssdiisi', $nombre, $descripcion, $precio, $id_categoria, $stock_actual, $imagen_url, $id_producto);
        $stmt->execute();
    } else {
        $stmt = $conn->prepare("INSERT INTO productos (nombre_producto, descripcion, precio, id_categoria, stock_actual, imagen_url) VALUES (?, ?, ?, ?, ?, ?)");
        $stmt->bind_param('ssdiis', $nombre, $descripcion, $precio, $id_categoria, $stock_actual, $imagen_url);
        $stmt->execute();
    }
    header("Location: ../G.sProductos.php?success=1");
    exit();
}
?>

<!DOCTYPE html>
<html lang="es">

<head>
    <meta charset="UTF-8" />
    <title><?= $modo ?></title>
    <link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/bootstrap@4.5.3/dist/css/bootstrap.min.css">
</head>

<body class="bg-light">
    <div class="container mt-5">
        <h2 class="mb-4"><?= $modo ?></h2>
        <form method="post">
            <input type="hidden" name="id_producto" value="<?= $id_producto ?>">
            <div class="form-group">
                <label>Nombre del Producto</label>
                <input type="text" name="nombre" class="form-control" required value="<?= htmlspecialchars($nombre) ?>">
            </div>
            <div class="form-group">
                <label>Descripción</label>
                <textarea name="descripcion" class="form-control"><?= htmlspecialchars($descripcion) ?></textarea>
            </div>
            <div class="form-group">
                <label>Precio</label>
                <input type="number" step="0.01" name="precio" class="form-control" required value="<?= $precio ?>">
            </div>
            <div class="form-group">
                <label>ID Categoría</label>
                <input type="number" name="id_categoria" class="form-control" required value="<?= $id_categoria ?>">
            </div>
            <div class="form-group">
                <label>Stock Actual</label>
                <input type="number" name="stock_actual" class="form-control" required value="<?= $stock_actual ?>">
            </div>
            <div class="form-group">
                <label>Imagen URL</label>
                <input type="text" name="imagen_url" class="form-control" value="<?= htmlspecialchars($imagen_url) ?>">
            </div>
            <button type="submit" class="btn btn-success">Guardar</button>
            <a href="../G.sProductos.php" class="btn btn-secondary">Cancelar</a>
        </form>
    </div>
</body>

</html>