<?php
ini_set('display_errors', 1);
ini_set('display_startup_errors', 1);
error_reporting(E_ALL);

// Asegúrate de que esta ruta sea correcta para db_connection.php
// Si db_connection.php está en la misma carpeta que process_reservation.php, esto es correcto.
include 'db_connection.php';

// Esto debe ser lo primero después del include de la conexión
header('Content-Type: application/json');

$response = ['success' => false, 'message' => ''];

// Recibir los datos del frontend
$data = json_decode(file_get_contents('php://input'), true);

if (!isset($data['id_cliente']) || !isset($data['fecha_recojo']) || !isset($data['hora_recojo']) || !isset($data['total_pagar']) || !isset($data['productos'])) {
    $response['message'] = 'Datos incompletos para la reserva.';
    echo json_encode($response);
    exit(); // exit() es importante aquí
}

$id_cliente = intval($data['id_cliente']);
$fecha_recojo = $data['fecha_recojo'];
$hora_recojo = $data['hora_recojo'];
$total_pagar = floatval($data['total_pagar']);
$productos_carrito = $data['productos'];

// Iniciar transacción
$conn->begin_transaction();

try {
    // 0. *** LÓGICA: Verificar y descontar el saldo del cliente ***
    // Bloqueamos la fila del cliente para evitar problemas de concurrencia
    $stmt_saldo = $conn->prepare("SELECT dinero FROM clientes WHERE id_cliente = ? FOR UPDATE");
    // Añadir verificación de prepare para mayor robustez
    if (!$stmt_saldo) {
        throw new Exception("Error al preparar la consulta de saldo: " . $conn->error);
    }
    $stmt_saldo->bind_param("i", $id_cliente);
    $stmt_saldo->execute();
    $result_saldo = $stmt_saldo->get_result();
    $cliente = $result_saldo->fetch_assoc();
    $stmt_saldo->close();

    if (!$cliente) {
        throw new Exception("Cliente no encontrado.");
    }

    $saldo_actual = floatval($cliente['dinero']);

    if ($saldo_actual < $total_pagar) {
        throw new Exception("Saldo insuficiente. Saldo actual: S/ " . number_format($saldo_actual, 2) . ", Total a pagar: S/ " . number_format($total_pagar, 2));
    }

    $nuevo_saldo = $saldo_actual - $total_pagar;
    $stmt_update_cliente = $conn->prepare("UPDATE clientes SET dinero = ? WHERE id_cliente = ?");
    // Añadir verificación de prepare
    if (!$stmt_update_cliente) {
        throw new Exception("Error al preparar la actualización de saldo: " . $conn->error);
    }
    $stmt_update_cliente->bind_param("di", $nuevo_saldo, $id_cliente);
    if (!$stmt_update_cliente->execute()) {
        throw new Exception("Error al descontar dinero del cliente: " . $stmt_update_cliente->error);
    }
    $stmt_update_cliente->close();
    // *** FIN LÓGICA DE DESCUENTO DE SALDO ***

    // 1. Insertar en la tabla 'reservas'
    // Asumo que 'tipo_pago' siempre será 'Yape' desde el JS o que lo manejas de otra forma.
    // Si $data['tipo_pago'] puede venir y lo quieres usar, déjalo, sino usa 'Yape'.
    $tipo_pago_final = $data['tipo_pago'] ?? 'Yape'; // Si el frontend no envía 'tipo_pago', usa 'Yape'

    $stmt_reserva = $conn->prepare("INSERT INTO reservas (id_cliente, fecha_reserva, hora_reserva, estado_reserva, total_pagar, tipo_pago) VALUES (?, ?, ?, 'Pendiente', ?, ?)");
    // Añadir verificación de prepare
    if (!$stmt_reserva) {
        throw new Exception("Error al preparar la inserción de reserva: " . $conn->error);
    }
    $stmt_reserva->bind_param("issds", $id_cliente, $fecha_recojo, $hora_recojo, $total_pagar, $tipo_pago_final);

    if (!$stmt_reserva->execute()) {
        throw new Exception("Error al insertar reserva: " . $stmt_reserva->error);
    }
    $id_reserva = $conn->insert_id;
    $stmt_reserva->close();

    // 2. Insertar en la tabla 'detalle_reserva' y actualizar 'stock_actual' de productos
    foreach ($productos_carrito as $producto) {
        $id_producto = intval($producto['id_producto']);
        $cantidad = intval($producto['cantidad']);
        $precio_unitario = floatval($producto['precio']);

        // Verificar stock actual antes de insertar
        $stmt_check_stock = $conn->prepare("SELECT stock_actual FROM productos WHERE id_producto = ? FOR UPDATE");
        // Añadir verificación de prepare
        if (!$stmt_check_stock) {
            throw new Exception("Error al preparar la consulta de stock: " . $conn->error);
        }
        $stmt_check_stock->bind_param("i", $id_producto);
        $stmt_check_stock->execute();
        $result_stock = $stmt_check_stock->get_result();

        if ($result_stock->num_rows === 0) {
            throw new Exception("Producto con ID " . $id_producto . " no encontrado.");
        }

        $current_stock = $result_stock->fetch_assoc()['stock_actual'];
        $stmt_check_stock->close();

        if ($current_stock < $cantidad) {
            throw new Exception("Stock insuficiente para el producto: " . ($producto['nombre_producto'] ?? 'ID ' . $id_producto) . ". Stock actual: " . $current_stock . ", solicitado: " . $cantidad);
        }

        // Insertar en detalle_reserva
        $stmt_detalle = $conn->prepare("INSERT INTO detalle_reserva (id_reserva, id_producto, cantidad, precio_unitario) VALUES (?, ?, ?, ?)");
        // Añadir verificación de prepare
        if (!$stmt_detalle) {
            throw new Exception("Error al preparar la inserción de detalle: " . $conn->error);
        }
        $stmt_detalle->bind_param("iiid", $id_reserva, $id_producto, $cantidad, $precio_unitario);
        if (!$stmt_detalle->execute()) {
            throw new Exception("Error al insertar detalle de reserva para producto " . ($producto['nombre_producto'] ?? 'ID ' . $id_producto) . ": " . $stmt_detalle->error);
        }
        $stmt_detalle->close();

        // Actualizar stock del producto
        $stmt_update_stock = $conn->prepare("UPDATE productos SET stock_actual = stock_actual - ? WHERE id_producto = ?");
        // Añadir verificación de prepare
        if (!$stmt_update_stock) {
            throw new Exception("Error al preparar la actualización de stock: " . $conn->error);
        }
        $stmt_update_stock->bind_param("ii", $cantidad, $id_producto);
        if (!$stmt_update_stock->execute()) {
            throw new Exception("Error al actualizar stock para producto " . ($producto['nombre_producto'] ?? 'ID ' . $id_producto) . ": " . $stmt_update_stock->error);
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
} finally {
    // Asegurarse de cerrar la conexión al final
    if ($conn) { // Verifica que $conn exista antes de cerrarla
        $conn->close();
    }
}

echo json_encode($response);
?>