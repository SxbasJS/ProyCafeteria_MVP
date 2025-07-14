<?php
require_once 'Codigo_PHP/db_connection.php';
session_start();

if (!isset($_SESSION['username'])) {
    header("Location: login.php");
    exit();
}

// Detectar parámetro para mostrar modal
$showSuccessModal = isset($_GET['success']) && $_GET['success'] == '1';

// Cargar productos con categoría
$result = $conn->query("
    SELECT p.id_producto, p.nombre_producto, p.descripcion, p.precio, c.nombre_categoria, p.stock_actual, p.imagen_url
    FROM productos p
    INNER JOIN categorias c ON p.id_categoria = c.id_categoria
    ORDER BY p.id_producto ASC
");
?>

<!DOCTYPE html>
<html lang="es">

<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Gestion de Productos</title>
    <link rel="shortcut icon" href="img/LogoCafe.webp" type="image/x-icon">

    <!-- Less -->
    <link rel="stylesheet/less" type="text/css" href="index.less" />
    <script src="https://cdn.jsdelivr.net/npm/less"></script>

    <!-- Bootstrap -->
    <link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/bootstrap@4.5.3/dist/css/bootstrap.min.css"
        integrity="sha384-TX8t27EcRE3e/ihU7zmQxVncDAy5uIKz4rEkgIXeMed4M0jlfIDPvg6uqKI2xXr2" crossorigin="anonymous">
    <script src="https://cdn.jsdelivr.net/npm/bootstrap@4.5.3/dist/js/bootstrap.bundle.min.js"
        integrity="sha384-ho+j7jyWK8fNQe+A12hP1JpIPli+Azbu1BjmaDxmWE9vLMtFtIANo/rmJf7nL4x4" crossorigin="anonymous">
    </script>

    <!-- Jquery -->
    <script src="https://ajax.googleapis.com/ajax/libs/jquery/3.7.1/jquery.min.js"></script>

    <!-- FontAwesome -->
    <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.5.2/css/all.min.css"
        integrity="sha512-SnH5WK+bZxgPHs44uWIX+LLJAJ9/2PkPKZ5QiAj6Ta86w+fsb2TkcmfRyVX3pBnMFcV7oQPJkl9QevSCWr3W6A=="
        crossorigin="anonymous" referrerpolicy="no-referrer" />
    <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/5.15.4/css/all.min.css">

</head>

<body class="bg-light">
    <!-- Encabezado(header) -->
    <header class="header">
        <div class="menu container" id="menu container">
            <a href="index.html" class="logo"><img src="img/LogoCafe.webp" alt="" class="MainLogo"></a>
            <input type="checkbox" id="menu">
            <label for="menu">
                <img src="img/menu.png" class="menu-icono" alt="">
            </label>
            <nav class="navbar">
                <ul>
                    <li><a href="admin.html">Inicio</a></li>
                    <li><a href="G.sProductos.php">Gestión Productos</a></li>
                    <li><a href="G.sReservas.php">Gestión Reservas</a></li>
                    <li><a href="logout.php">Cerrar Sesion</a></li>
                </ul>
            </nav>
        </div>

        <div class="header-content container">
            <h1>Gestión de Productos</h1>
            <p>
                Gestionar todos los productos de la cafeteria.
            </p>
        </div>
    </header>
    <div class="container mt-5">
        <h2 class="mb-4">Gestión de Productos |</h2>

        <a href="Codigo_PHP/producto_form.php" class="btn btn-success mb-3">
            <i class="fas fa-plus"></i> Nuevo Producto
        </a>

        <table class="table table-bordered table-striped">
            <thead class="table-dark">
                <tr>
                    <th>ID</th>
                    <th>Nombre</th>
                    <th>Descripción</th>
                    <th>Precio</th>
                    <th>Categoría</th>
                    <th>Stock</th>
                    <th>Imagen</th>
                    <th>Acciones</th>
                </tr>
            </thead>
            <tbody>
                <?php if ($result->num_rows > 0): ?>
                <?php while ($row = $result->fetch_assoc()): ?>
                <tr>
                    <td><?= $row['id_producto'] ?></td>
                    <td><?= htmlspecialchars($row['nombre_producto']) ?></td>
                    <td><?= htmlspecialchars($row['descripcion']) ?></td>
                    <td>S/ <?= number_format($row['precio'], 2) ?></td>
                    <td><?= htmlspecialchars($row['nombre_categoria']) ?></td>
                    <td><?= $row['stock_actual'] ?></td>
                    <td>
                        <?php if ($row['imagen_url']): ?>
                        <img src="<?= htmlspecialchars($row['imagen_url']) ?>" width="50" height="50">
                        <?php else: ?>
                        -
                        <?php endif; ?>
                    </td>
                    <td>
                        <a href="Codigo_PHP/producto_form.php?id=<?= $row['id_producto'] ?>"
                            class="btn btn-sm btn-primary">
                            <i class="fas fa-edit"></i> Editar
                        </a>
                        <a href="Codigo_PHP/producto_delete.php?id=<?= $row['id_producto'] ?>"
                            class="btn btn-sm btn-danger"
                            onclick="return confirm('¿Seguro que deseas eliminar este producto?')">
                            <i class="fas fa-trash"></i> Eliminar
                        </a>
                    </td>
                </tr>
                <?php endwhile; ?>
                <?php else: ?>
                <tr>
                    <td colspan="8" class="text-center">No hay productos registrados.</td>
                </tr>
                <?php endif; ?>
            </tbody>
        </table>
    </div>

    <!-- Modal de éxito -->
    <div class="modal fade" id="successModal" tabindex="-1" aria-labelledby="successModalLabel" aria-hidden="true">
        <div class="modal-dialog modal-dialog-centered">
            <div class="modal-content">
                <div class="modal-header bg-success text-white">
                    <h5 class="modal-title" id="successModalLabel">¡Éxito!</h5>
                    <button type="button" class="close text-white" data-dismiss="modal" aria-label="Cerrar">
                        <span aria-hidden="true">&times;</span>
                    </button>
                </div>
                <div class="modal-body">
                    ✅ El producto fue guardado correctamente.
                </div>
                <div class="modal-footer">
                    <button type="button" class="btn btn-success" data-dismiss="modal">Aceptar</button>
                </div>
            </div>
        </div>
    </div>
    <!-- Footer -->
    <footer class="footer">
        <div class="container">
            <div class="footer-row">
                <div class="footer-links">
                    <h4>Horario de Reservas (online):</h4>
                    <ul>
                        <li>Lunes a Viernes: 8:00 AM - 2:00 PM</li>
                        <li>Nota: Las reservas deben ser recogidas el mismo día.</li>
                    </ul>
                </div>
                <div class="footer-links">
                    <h4>Información de la Cafetería:</h4>
                    <ul>
                        <li>Ubicación: Campus Universitario, Chorrillos, Lima</li>
                        <li>Teléfono: +51 987 654 321</li>
                        <li>Email: contacto@cafeteriauniversitaria.com</li>
                    </ul>
                </div>
            </div>
        </div>
    </footer>

    <!-- Scripts -->
    <script src="https://code.jquery.com/jquery-3.5.1.min.js"></script>
    <script src="https://cdn.jsdelivr.net/npm/bootstrap@4.5.3/dist/js/bootstrap.bundle.min.js"></script>

    <?php if ($showSuccessModal): ?>
    <script>
    $(document).ready(function() {
        $('#successModal').modal('show');
    });
    </script>
    <?php endif; ?>
</body>

</html>