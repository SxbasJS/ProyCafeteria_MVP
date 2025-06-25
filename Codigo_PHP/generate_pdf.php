<?php
// php/generate_pdf.php
require_once '../vendor/autoload.php'; // Ajusta la ruta a autoload.php
use Dompdf\Dompdf;
use Dompdf\Options;

include 'db_connection.php'; // Incluye tu archivo de conexión

if (!isset($_GET['id_reserva'])) {
    die("ID de reserva no proporcionado.");
}

$id_reserva = intval($_GET['id_reserva']);

// Obtener datos de la reserva
$sql_reserva = "SELECT r.*, c.nombre AS cliente_nombre, c.apellido AS cliente_apellido, c.codigo_universitario, c.tipo_cliente 
                FROM reservas r 
                JOIN clientes c ON r.id_cliente = c.id_cliente 
                WHERE r.id_reserva = ?";
$stmt_reserva = $conn->prepare($sql_reserva);
$stmt_reserva->bind_param("i", $id_reserva);
$stmt_reserva->execute();
$result_reserva = $stmt_reserva->get_result();
$reserva = $result_reserva->fetch_assoc();
$stmt_reserva->close();

if (!$reserva) {
    die("Reserva no encontrada.");
}

// Obtener detalles de la reserva
$sql_detalle = "SELECT dr.cantidad, dr.precio_unitario, p.nombre_producto 
                FROM detalle_reserva dr 
                JOIN productos p ON dr.id_producto = p.id_producto 
                WHERE dr.id_reserva = ?";
$stmt_detalle = $conn->prepare($sql_detalle);
$stmt_detalle->bind_param("i", $id_reserva);
$stmt_detalle->execute();
$result_detalle = $stmt_detalle->get_result();
$detalles = [];
while ($row = $result_detalle->fetch_assoc()) {
    $detalles[] = $row;
}
$stmt_detalle->close();
$conn->close();

// Generar el contenido HTML del PDF
$html = '
<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <title>Resumen de Reserva #' . $reserva['id_reserva'] . '</title>
    <style>
        body { font-family: Arial, sans-serif; margin: 20px; font-size: 12px; }
        .header { text-align: center; margin-bottom: 30px; }
        .header h1 { color: #dc3545; }
        .details, .products-table { width: 100%; border-collapse: collapse; margin-bottom: 20px; }
        .details th, .details td, .products-table th, .products-table td { border: 1px solid #ddd; padding: 8px; text-align: left; }
        .details th { background-color: #f2f2f2; width: 30%; }
        .products-table th { background-color: #dc3545; color: white; }
        .total { text-align: right; font-size: 14px; font-weight: bold; margin-top: 20px; }
        .footer { text-align: center; margin-top: 50px; font-size: 10px; color: #888; }
    </style>
</head>
<body>
    <div class="header">
        <h1>Resumen de Reserva - Cafetería UTP</h1>
        <p>Confirmación de Pedido y Recojo</p>
    </div>

    <h3>Datos de la Reserva</h3>
    <table class="details">
        <tr>
            <th>ID de Reserva:</th>
            <td>#' . $reserva['id_reserva'] . '</td>
        </tr>
        <tr>
            <th>Fecha de Emisión:</th>
            <td>' . date('d/m/Y H:i:s', strtotime($reserva['fecha_creacion'])) . '</td>
        </tr>
        <tr>
            <th>Fecha de Recojo:</th>
            <td>' . date('d/m/Y', strtotime($reserva['fecha_reserva'])) . '</td>
        </tr>
        <tr>
            <th>Hora de Recojo:</th>
            <td>' . date('H:i', strtotime($reserva['hora_reserva'])) . '</td>
        </tr>
        <tr>
            <th>Estado:</th>
            <td>' . $reserva['estado_reserva'] . '</td>
        </tr>
    </table>

    <h3>Datos del Cliente</h3>
    <table class="details">
        <tr>
            <th>Código Universitario:</th>
            <td>' . $reserva['codigo_universitario'] . '</td>
        </tr>
        <tr>
            <th>Tipo de Cliente:</th>
            <td>' . $reserva['tipo_cliente'] . '</td>
        </tr>
        <tr>
            <th>Nombre:</th>
            <td>' . $reserva['cliente_nombre'] . '</td>
        </tr>
        <tr>
            <th>Apellido:</th>
            <td>' . $reserva['cliente_apellido'] . '</td>
        </tr>
    </table>

    <h3>Productos Reservados</h3>
    <table class="products-table">
        <thead>
            <tr>
                <th>Producto</th>
                <th>Cantidad</th>
                <th>Precio Unitario</th>
                <th>Subtotal</th>
            </tr>
        </thead>
        <tbody>';
            $total_productos = 0;
            foreach ($detalles as $detalle) {
                $subtotal = $detalle['cantidad'] * $detalle['precio_unitario'];
                $total_productos += $subtotal;
                $html .= '
                <tr>
                    <td>' . $detalle['nombre_producto'] . '</td>
                    <td>' . $detalle['cantidad'] . '</td>
                    <td>S/ ' . number_format($detalle['precio_unitario'], 2) . '</td>
                    <td>S/ ' . number_format($subtotal, 2) . '</td>
                </tr>';
            }
$html .= '
        </tbody>
    </table>

    <div class="total">
        <p><strong>Total a Pagar: S/ ' . number_format($reserva['total_pagar'], 2) . '</strong></p>
        <p>Tipo de Pago: ' . $reserva['tipo_pago'] . '</p>
    </div>

    <div class="footer">
        <p>&copy; ' . date('Y') . ' Cafetería UTP. Todos los derechos reservados.</p>
        <p>Gracias por tu reserva.</p>
    </div>
</body>
</html>';

// Configuración y renderizado del PDF
$options = new Options();
$options->set('isHtml5ParserEnabled', true);
$options->set('isRemoteEnabled', true); // Habilitar carga de imágenes remotas si usas https://via.placeholder.com

$dompdf = new Dompdf($options);
$dompdf->loadHtml($html);
$dompdf->setPaper('A4', 'portrait');
$dompdf->render();

// Enviar el PDF al navegador
$dompdf->stream("resumen_reserva_" . $reserva['id_reserva'] . ".pdf", array("Attachment" => true)); // Attachment=true para descarga
?>