<?php
// php/db_connection.php
$servername = "localhost"; 
$username = "root";        
$password = "";            
$dbname = "cafeteria_db";  

// Crear conexión
$conn = new mysqli($servername, $username, $password, $dbname);

// Verificar conexión
if ($conn->connect_error) {
    die("Conexión fallida: " . $conn->connect_error);
}

// Opcional: Establecer el conjunto de caracteres a UTF-8
$conn->set_charset("utf8");

// Para evitar problemas de CORS si tu frontend y backend están en diferentes dominios
header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type, Authorization");

// Manejar solicitudes OPTIONS (preflight requests) para CORS
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit();
}
?>