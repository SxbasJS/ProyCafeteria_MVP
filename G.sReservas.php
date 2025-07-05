<?php
require_once 'Codigo_PHP/db_connection.php';
session_start();

if (!isset($_SESSION['username'])) {
    header("Location: login.php");
    exit();
}

$filtro_codigo = isset($_GET['codigo_universitario']) ? trim($_GET['codigo_universitario']) : '';

$query = "
    SELECT 
        r.id_reserva, 
        c.codigo_universitario, 
        c.nombre, 
        c.apellido, 
        r.fecha_reserva, 
        r.hora_reserva, 
        r.estado_reserva, 
        r.total_pagar, 
        r.tipo_pago,
        r.fecha_creacion,
        GROUP_CONCAT(CONCAT('ID: ', d.id_producto, ' (Cant: ', d.cantidad, ')') SEPARATOR '<br>') AS detalles_productos
    FROM reservas r
    INNER JOIN clientes c ON r.id_cliente = c.id_cliente
    LEFT JOIN detalle_reserva d ON r.id_reserva = d.id_reserva
    WHERE 1
";

$params = [];
$types = '';

if ($filtro_codigo !== '') {
    $query .= " AND c.codigo_universitario LIKE ?";
    $params[] = '%' . $filtro_codigo . '%';
    $types .= 's';
}

$query .= " GROUP BY r.id_reserva
            ORDER BY r.fecha_creacion DESC";

$stmt = $conn->prepare($query);
if (!empty($params)) {
    $stmt->bind_param($types, ...$params);
}
$stmt->execute();
$result = $stmt->get_result();
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
    <header class="header">
        <div class="menu container">
            <a href="index.html" class="logo"><img src="img/LogoCafe.webp" alt="" class="MainLogo"></a>
            <input type="checkbox" id="menu">
            <label for="menu"><img src="img/menu.png" class="menu-icono" alt=""></label>
            <nav class="navbar">
                <ul>
                    <li><a href="admin.html">Inicio</a></li>
                    <li><a href="G.sProductos.php">Gestión Productos</a></li>
                    <li><a href="G.sReservas.php">Gestión Reservas</a></li>
                    <li><a href="logout.php">Cerrar Sesión</a></li>
                </ul>
            </nav>
        </div>
        <div class="header-content container">
            <h1>Reservas Registradas</h1>
            <p>Visualiza y gestiona todas las reservas que se han realizado.</p>
        </div>
    </header>

    <div class="container mt-5">
        <h2 class="mb-4">Gestión de Reservas</h2>

        <!-- Alertas -->
        <?php if (isset($_GET['msg'])): ?>
            <?php if ($_GET['msg'] == 'confirmado'): ?>
                <div class="alert alert-success">¡Reserva confirmada!</div>
            <?php elseif ($_GET['msg'] == 'cancelada'): ?>
                <div class="alert alert-warning">¡Reserva cancelada!</div>
            <?php else: ?>
                <div class="alert alert-danger">Ocurrió un error al actualizar la reserva.</div>
            <?php endif; ?>
        <?php endif; ?>

        <!-- Filtro -->
        <div class="card mb-4">
            <div class="card-body">
                <form class="row g-3" method="get">
                    <div class="col-md-6">
                        <label class="form-label">Código Universitario</label>
                        <input type="text" name="codigo_universitario" class="form-control"
                            value="<?= htmlspecialchars($filtro_codigo) ?>" placeholder="Ingrese código universitario">
                    </div>
                    <div class="col-md-3 align-self-end">
                        <button type="submit" class="btn btn-primary w-100">Buscar</button>
                    </div>
                    <div class="col-md-3 align-self-end">
                        <a href="G.sReservas.php" class="btn btn-secondary w-100">Limpiar</a>
                    </div>
                </form>
            </div>
        </div>

        <!-- Tabla -->
        <!-- Tabla -->
        <table class="table table-bordered table-striped">
            <thead class="table-dark">
                <tr>
                    <th>ID Reserva</th>
                    <th>Código Universitario</th>
                    <th>Nombre</th>
                    <th>Apellido</th>
                    <th>Fecha Creación</th>
                    <th>Fecha Recojo</th>
                    <th>Hora Recojo</th>
                    <th style="width:250px;">Detalle Productos</th>
                    <th>Estado</th>
                    <th>Total a Pagar</th>
                    <th>Tipo Pago</th>
                </tr>
            </thead>
            <tbody>
                <?php if ($result->num_rows > 0): ?>
                    <?php while ($row = $result->fetch_assoc()): ?>
                        <tr>
                            <td><?= $row['id_reserva'] ?></td>
                            <td><?= htmlspecialchars($row['codigo_universitario']) ?></td>
                            <td><?= htmlspecialchars($row['nombre']) ?></td>
                            <td><?= htmlspecialchars($row['apellido']) ?></td>
                            <td><?= $row['fecha_creacion'] ?></td>
                            <td><?= $row['fecha_reserva'] ?></td>
                            <td><?= $row['hora_reserva'] ?></td>
                            <td style="width:250px;"><?= $row['detalles_productos'] ?: '<em>Sin productos</em>' ?></td>
                            <td>
                                <span
                                    class="badge 
                            <?= $row['estado_reserva'] == 'Pendiente' ? 'badge-warning' : ($row['estado_reserva'] == 'Confirmada' ? 'badge-success' : ($row['estado_reserva'] == 'Cancelada' ? 'badge-danger' : 'badge-secondary')) ?>">
                                    <?= $row['estado_reserva'] ?>
                                </span>
                                <?php if ($row['estado_reserva'] == 'Pendiente'): ?>
                                    <div class="mt-2 d-flex flex-wrap">
                                        <a href="Codigo_PHP/update_estado_reserva.php?id=<?= $row['id_reserva'] ?>"
                                            class="btn btn-sm btn-success mr-2 mb-2"
                                            onclick="return confirm('¿Confirmar esta reserva?');">
                                            Confirmar
                                        </a>
                                        <a href="Codigo_PHP/cancelar_estado_reserva.php?id=<?= $row['id_reserva'] ?>"
                                            class="btn btn-sm btn-danger mb-2" onclick="return confirm('¿Cancelar esta reserva?');">
                                            Cancelar
                                        </a>
                                    </div>
                                <?php endif; ?>
                            </td>
                            <td>S/ <?= $row['total_pagar'] ?></td>
                            <td><?= $row['tipo_pago'] ?></td>
                        </tr>
                    <?php endwhile; ?>
                <?php else: ?>
                    <tr>
                        <td colspan="11" class="text-center">No se encontraron resultados.</td>
                    </tr>
                <?php endif; ?>
            </tbody>
        </table>

    </div>

    <footer class="footer mt-5">
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
</body>

</html>