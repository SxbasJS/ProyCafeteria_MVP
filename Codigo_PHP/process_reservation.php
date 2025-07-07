<?php
// php/process_reservation.php
include 'db_connection.php';

header('Content-Type: application/json');

$response = ['success' => false, 'message' => ''];

// Recibir los datos del frontend
$data = json_decode(file_get_contents('php://input'), true);

if (!isset($data['id_cliente']) || !isset($data['fecha_recojo']) || !isset($data['hora_recojo']) || !isset($data['total_pagar']) || !isset($data['productos'])) {
    $response['message'] = 'Datos incompletos para la reserva.';
    echo json_encode($response);
    $conn->close();
    exit();
}

$id_cliente = $data['id_cliente'];
$fecha_recojo = $data['fecha_recojo'];
$hora_recojo = $data['hora_recojo'];
$total_pagar = $data['total_pagar'];
$productos_carrito = $data['productos'];

// Iniciar transacción
$conn->begin_transaction();

try {
    // 1. Insertar en la tabla 'reservas'
    $stmt_reserva = $conn->prepare("INSERT INTO reservas (id_cliente, fecha_reserva, hora_reserva, estado_reserva, total_pagar, tipo_pago) VALUES (?, ?, ?, 'Pendiente', ?, 'Efectivo')");
    $stmt_reserva->bind_param("issd", $id_cliente, $fecha_recojo, $hora_recojo, $total_pagar);
    
    if (!$stmt_reserva->execute()) {
        throw new Exception("Error al insertar reserva: " . $stmt_reserva->error);
    }
    $id_reserva = $conn->insert_id;
    $stmt_reserva->close();

    // 2. Insertar en la tabla 'detalle_reserva' y actualizar 'stock_actual' de productos
    foreach ($productos_carrito as $producto) {
        $id_producto = $producto['id_producto'];
        $cantidad = $producto['cantidad'];
        $precio_unitario = $producto['precio'];

        // Verificar stock actual antes de insertar
        $stmt_check_stock = $conn->prepare("SELECT stock_actual FROM productos WHERE id_producto = ? FOR UPDATE"); // Bloquea la fila
        $stmt_check_stock->bind_param("i", $id_producto);
        $stmt_check_stock->execute();
        $result_stock = $stmt_check_stock->get_result();
        $current_stock = $result_stock->fetch_assoc()['stock_actual'];
        $stmt_check_stock->close();

        if ($current_stock < $cantidad) {
            throw new Exception("Stock insuficiente para el producto: " . $producto['nombre_producto'] . ". Stock actual: " . $current_stock . ", solicitado: " . $cantidad);
        }

        // Insertar en detalle_reserva
        $stmt_detalle = $conn->prepare("INSERT INTO detalle_reserva (id_reserva, id_producto, cantidad, precio_unitario) VALUES (?, ?, ?, ?)");
        $stmt_detalle->bind_param("iiid", $id_reserva, $id_producto, $cantidad, $precio_unitario);
        if (!$stmt_detalle->execute()) {
            throw new Exception("Error al insertar detalle de reserva para producto " . $producto['nombre_producto'] . ": " . $stmt_detalle->error);
        }
        $stmt_detalle->close();

        // Actualizar stock del producto
        $stmt_update_stock = $conn->prepare("UPDATE productos SET stock_actual = stock_actual - ? WHERE id_producto = ?");
        $stmt_update_stock->bind_param("ii", $cantidad, $id_producto);
        if (!$stmt_update_stock->execute()) {
            throw new Exception("Error al actualizar stock para producto " . $producto['nombre_producto'] . ": " . $stmt_update_stock->error);
        }
        $stmt_update_stock->close();
    }

    // Si todo va bien, confirmar la transacción
    $conn->commit();
    $response['success'] = true;
    $response['message'] = 'Reserva realizada con éxito.';
    $response['id_reserva'] = $id_reserva;

} catch (Exception $e) {
    // Si algo falla, revertir la transacción
    $conn->rollback();
    $response['message'] = 'Error al procesar la reserva: ' . $e->getMessage();
}

echo json_encode($response);
$conn->close();
?>