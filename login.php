<?php
session_start();
if (isset($_SESSION['username'])) {
    header("Location: admin.html");
    exit();
}
?>
<!DOCTYPE html>
<html lang="es">

<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Admin - Panel</title>
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
            <!-- Colocar el logo -->
            <input type="checkbox" id="menu">
            <label for="menu">
                <img src="img/menu.png" class="menu-icono" alt="">
            </label>
            <nav class="navbar">
                <ul>
                    <li><a href="index.html">Inicio</a></li>
                    <li><a href="menu.html">Menú</a></li>
                    <li><a href="Reserva.html">Reserva</a></li>
                    <li><a href="galeria.html">Galería</a></li>
                    <li><a href="login.php">Admin</a></li>
                </ul>
            </nav>
        </div>

        <div class="header-content container">
            <h1>Zona Administrativa</h1>
            <p>
                Bienvenido a la zona administrativo para ello requiere de un inicio de sesión. Por ahora, solo los
                administradores podrán acceder. Esto se debe a que
                la sección a la que intentas ingresar está destinada únicamente para gestión interna, donde se podrá
                llevar a cabo información detallada sobre las reservas, supervisarlas y realizar otras tareas
                administrativas cruciales.
            </p>
        </div>
    </header>
    <br>
    <br>
    <br>

    <div class="container mt-5">
        <div class="row justify-content-center">
            <div class="col-md-4">
                <div class="card shadow">
                    <div class="card-body">
                        <h4 class="card-title text-center mb-4">Login Admin</h4>
                        <?php if (isset($_GET['error'])): ?>
                        <div class="alert alert-danger"><?php echo htmlspecialchars($_GET['error']); ?></div>
                        <?php endif; ?>
                        <form action="Codigo_PHP/check_login.php" method="post">
                            <div class="mb-3">
                                <label for="username" class="form-label">Usuario</label>
                                <input type="text" class="form-control" id="username" name="username" required>
                            </div>
                            <div class="mb-3">
                                <label for="password" class="form-label">Contraseña</label>
                                <input type="password" class="form-control" id="password" name="password" required>
                            </div>
                            <button type="submit" class="btn btn-primary w-100">Ingresar</button>
                        </form>
                    </div>
                </div>
            </div>
        </div>
    </div>
    <br>
    <br>
    <br>
    <br>

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

</body>

</html>