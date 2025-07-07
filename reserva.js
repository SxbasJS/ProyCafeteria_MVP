// js/reserva.js

$(document).ready(function () {
    // 1. Declaración de variables globales dentro del scope de jQuery ready
    let cart = JSON.parse(localStorage.getItem('cart')) || [];
    let clienteData = null; // Para almacenar los datos del cliente validado
    let totalPagarActual = 0; // Variable para almacenar el total a pagar

    // NUVAS VARIABLES PARA LAS SECCIONES DE PAGO
    const opcionesMetodoPago = $('#opciones-metodo-pago');
    const btnElegirTarjeta = $('#btn-elegir-tarjeta');
    const btnElegirYape = $('#btn-elegir-yape');
    const btnElegirEfectivo = $('#btn-elegir-efectivo'); // Nuevo botón para efectivo

    const seccionPagoTarjeta = $('#seccion-pago-tarjeta');
    const formPagoTarjetaSimulado = $('#form-pago-tarjeta-simulado');
    const mensajeResultadoTarjeta = $('#mensaje-resultado-tarjeta');

    const seccionPagoYape = $('#seccion-pago-yape');
    const btnConfirmarYapeSimulado = $('#btn-confirmar-yape-simulado');
    const mensajeResultadoYape = $('#mensaje-resultado-yape');
    const montoYapeSimulado = $('#monto-yape-simulado');

    const reservaConfirmadaFinal = $('#reserva-confirmada-final');
    const montoAPagarFinal = $('#monto-a-pagar-final');


    // 2. Función para calcular y mostrar el total
    function calculateAndDisplayTotal() {
        let total = 0;
        cart.forEach(item => {
            total += item.precio * item.cantidad;
        });
        totalPagarActual = total; // Actualizar la variable global
        $('#total-pagar').text(`S/ ${total.toFixed(2)}`);
        // Actualizar los montos en las secciones de pago
        montoAPagarFinal.text(`S/ ${total.toFixed(2)}`);
        montoYapeSimulado.text(`S/ ${total.toFixed(2)}`);
    }

    // 3. Función para cargar los productos del carrito en la pantalla de reserva
    function loadCartProducts() {
        $('#reserved-products-list').empty();
        if (cart.length === 0) {
            $('#reserved-products-list').append('<p id="empty-reservation-message" class="text-muted">No hay productos en el carrito para reservar.</p>');
            $('#btn-confirmar').prop('disabled', true);
            return;
        }

        $('#empty-reservation-message').remove(); // Quitar mensaje de carrito vacío si hay productos

        cart.forEach(item => {
            const productHtml = `
                <div class="card mb-2 product-in-cart" data-id="${item.id_producto}">
                    <div class="card-body d-flex justify-content-between align-items-center">
                        <div>
                            <h5>${item.nombre_producto}</h5>
                            <p class="mb-0">Precio Unitario: S/ ${item.precio.toFixed(2)}</p>
                            <p class="mb-0 text-muted">Stock Disponible: <span class="product-available-stock">${item.stock_actual !== undefined ? item.stock_actual : 'N/D'}</span></p>
                        </div>
                        <div class="d-flex align-items-center">
                            <button class="btn btn-sm btn-outline-secondary decrease-quantity" data-id="${item.id_producto}"><i class="fas fa-minus"></i></button>
                            <span class="mx-2 product-quantity">${item.cantidad}</span>
                            <button class="btn btn-sm btn-outline-secondary increase-quantity" data-id="${item.id_producto}"><i class="fas fa-plus"></i></button>
                        </div>
                    </div>
                </div>
            `;
            $('#reserved-products-list').append(productHtml);
        });
        calculateAndDisplayTotal();
        $('#btn-confirmar').prop('disabled', false); // Habilitar el botón de confirmar si hay productos
    }

    // 4. Función para cargar el stock real de los productos (CORREGIDA)
    async function fetchProductStocks() {
        const productIds = cart.map(item => item.id_producto);

        if (productIds.length === 0) {
            loadCartProducts();
            return;
        }

        try {
            const response = await $.ajax({
                url: 'Codigo_PHP/get_products.php',
                method: 'GET',
                data: { product_ids: productIds.join(',') },
                dataType: 'json'
            });

            cart = cart.map(cartItem => {
                const foundProduct = response.find(p => p.id_producto == cartItem.id_producto);
                if (foundProduct) {
                    // Asegúrate de que la cantidad en el carrito no exceda el stock real
                    const updatedQuantity = Math.min(cartItem.cantidad, parseInt(foundProduct.stock_actual));
                    if (updatedQuantity !== cartItem.cantidad) {
                        Swal.fire({
                            icon: 'warning',
                            title: 'Stock Actualizado',
                            text: `La cantidad de "${cartItem.nombre_producto}" se ajustó a ${updatedQuantity} debido a la disponibilidad de stock.`,
                            confirmButtonText: 'Entendido'
                        });
                    }
                    return {
                        ...cartItem,
                        stock_actual: parseInt(foundProduct.stock_actual),
                        cantidad: updatedQuantity // Ajustar la cantidad si excede el stock
                    };
                }
                return cartItem;
            }).filter(item => item.stock_actual !== undefined && item.stock_actual !== null && item.cantidad > 0); // Eliminar productos si no tienen stock o cantidad 0

            localStorage.setItem('cart', JSON.stringify(cart));

        } catch (error) {
            console.error("Error al obtener stock de productos:", error);
            Swal.fire({
                title: 'Error de Stock',
                text: 'No se pudo verificar el stock de algunos productos. Intente de nuevo o contacte a soporte.',
                icon: 'error',
                confirmButtonText: 'Aceptar'
            });
            $('#btn-confirmar').prop('disabled', true);
            $('#reserved-products-list').empty().append('<p class="text-danger">Error al cargar productos. Por favor, intente de nuevo.</p>');
            return;
        }
        loadCartProducts();
    }


    // 5. Validar Código UTP
    $('#codigoUrbano').on('blur', function () {
        const codigo = $(this).val();
        if (codigo.length > 0) {
            $.ajax({
                url: 'Codigo_PHP/get_client.php',
                method: 'GET',
                data: { codigo: codigo },
                dataType: 'json',
                success: function (response) {
                    if (response.success) {
                        clienteData = response.client;
                        $('#nombresApellidos').val(`${clienteData.nombre} ${clienteData.apellido}`);
                        $('#codigoValidation').text('').removeClass('text-danger').addClass('text-success').html('<i class="fas fa-check-circle"></i> Código válido.');
                    } else {
                        clienteData = null;
                        $('#nombresApellidos').val('');
                        $('#codigoValidation').text(response.message).removeClass('text-success').addClass('text-danger');
                    }
                },
                error: function (xhr, status, error) {
                    console.error('Error al validar código:', error);
                    clienteData = null;
                    $('#nombresApellidos').val('');
                    $('#codigoValidation').text('Error al validar el código. Intente de nuevo.').removeClass('text-success').addClass('text-danger');
                }
            });
        } else {
            clienteData = null;
            $('#nombresApellidos').val('');
            $('#codigoValidation').text('Por favor, ingrese su código UTP.').removeClass('text-success').addClass('text-danger');
        }
    });

    // 6. Eventos para aumentar/disminuir cantidad
    $(document).on('click', '.increase-quantity', function () {
        const productId = $(this).data('id');
        let item = cart.find(i => i.id_producto === productId);
        if (item) {
            if (item.cantidad < item.stock_actual) {
                item.cantidad++;
                $(this).siblings('.product-quantity').text(item.cantidad);
                calculateAndDisplayTotal();
                localStorage.setItem('cart', JSON.stringify(cart));
            } else {
                Swal.fire({
                    icon: 'warning',
                    title: 'Stock Limitado',
                    text: `No puedes agregar más de ${item.nombre_producto}. Stock máximo alcanzado (${item.stock_actual}).`,
                    confirmButtonText: 'Entendido'
                });
            }
        }
    });

    $(document).on('click', '.decrease-quantity', function () {
        const productId = $(this).data('id');
        let itemIndex = cart.findIndex(i => i.id_producto === productId);
        if (itemIndex > -1) {
            if (cart[itemIndex].cantidad > 1) {
                cart[itemIndex].cantidad--;
                $(this).siblings('.product-quantity').text(cart[itemIndex].cantidad);
            } else {
                Swal.fire({
                    title: '¿Eliminar producto?',
                    text: `¿Estás seguro de que quieres eliminar ${cart[itemIndex].nombre_producto} del carrito?`,
                    icon: 'warning',
                    showCancelButton: true,
                    confirmButtonColor: '#d33',
                    cancelButtonColor: '#3085d6',
                    confirmButtonText: 'Sí, eliminar',
                    cancelButtonText: 'No, mantener'
                }).then((result) => {
                    if (result.isConfirmed) {
                        cart.splice(itemIndex, 1);
                        $(this).closest('.product-in-cart').remove();
                        Swal.fire('Eliminado!', 'El producto ha sido eliminado del carrito.', 'success');
                        if (cart.length === 0) {
                            $('#reserved-products-list').append('<p id="empty-reservation-message" class="text-muted">No hay productos en el carrito para reservar.</p>');
                            $('#btn-confirmar').prop('disabled', true);
                        }
                        calculateAndDisplayTotal();
                        localStorage.setItem('cart', JSON.stringify(cart));
                    }
                });
                return; // Evitar que el resto del código se ejecute si se cancela la eliminación
            }
            calculateAndDisplayTotal();
            localStorage.setItem('cart', JSON.stringify(cart));
        }
    });

    // 7. Validación de fecha y hora
    $('#fechaRecojo, #horaRecojo').on('change', function () {
        const fecha = $('#fechaRecojo').val();
        const hora = $('#horaRecojo').val();
        const now = new Date();
        const selectedDateTime = new Date(`${fecha}T${hora}:00`);

        $('#fechaValidation').text('');
        $('#horaValidation').text('');

        if (!fecha || !hora) { // Si falta fecha o hora, no validar el rango
            return;
        }

        // Validar que no sea una fecha/hora pasada
        if (selectedDateTime < now) {
            $('#fechaValidation').text('La fecha y hora de recojo no pueden ser en el pasado.').addClass('text-danger');
            $('#horaValidation').text(''); // Limpiar si había un error específico de hora
            return;
        }

        // Validar horario de 8 AM a 2 PM (14:00)
        const [hour, minute] = hora.split(':').map(Number);
        if (hour < 8 || hour > 14 || (hour === 14 && minute > 0)) {
            $('#horaValidation').text('El horario de recojo debe ser entre 8:00 AM y 2:00 PM.').addClass('text-danger');
        } else {
            $('#horaValidation').text('');
        }
    });


    // 8. Botón Cancelar Reserva
    $('#btn-cancelar').on('click', function () {
        Swal.fire({
            title: '¿Estás seguro?',
            text: '¡Estás a punto de cancelar tu reserva! El carrito se vaciará y perderás los productos seleccionados.',
            icon: 'warning',
            showCancelButton: true,
            confirmButtonColor: '#d33',
            cancelButtonColor: '#3085d6',
            confirmButtonText: 'Sí, cancelar reserva',
            cancelButtonText: 'No, mantener reserva'
        }).then((result) => {
            if (result.isConfirmed) {
                localStorage.removeItem('cart'); // Vaciar el carrito
                Swal.fire(
                    '¡Reserva Cancelada!',
                    'Tu reserva ha sido cancelada y el carrito está vacío.',
                    'success'
                ).then(() => {
                    window.location.href = 'menu.html'; // Redirigir al menú
                });
            }
        });
    });

    // 9. MODIFICACIÓN: El botón "Confirmar Reserva" ahora mostrará las opciones de pago
    $('#reservation-form').on('submit', function (e) {
        e.preventDefault();

        // Validaciones finales antes de proceder al pago
        if (!clienteData) {
            Swal.fire('Error', 'Por favor, valide su código UTP.', 'error');
            $('#codigoUrbano').focus();
            return;
        }

        if (cart.length === 0) {
            Swal.fire('Error', 'El carrito de reserva está vacío.', 'error');
            return;
        }

        const fechaRecojo = $('#fechaRecojo').val();
        const horaRecojo = $('#horaRecojo').val();

        if (!fechaRecojo || !horaRecojo) {
            Swal.fire('Error', 'Por favor, complete la fecha y hora de recojo.', 'error');
            return;
        }

        const now = new Date();
        const selectedDateTime = new Date(`${fechaRecojo}T${horaRecojo}:00`);
        const [hour, minute] = horaRecojo.split(':').map(Number);

        if (selectedDateTime < now) {
            Swal.fire('Error', 'La fecha y hora de recojo no pueden ser en el pasado.', 'error');
            return;
        }
        if (hour < 8 || hour > 14 || (hour === 14 && minute > 0)) {
            Swal.fire('Error', 'El horario de recojo debe ser entre 8:00 AM y 2:00 PM.', 'error');
            return;
        }
        // Si todas las validaciones pasan, ocultar el formulario y mostrar opciones de pago
        $('#reservation-form').hide();
        opcionesMetodoPago.show();
        // Asegúrate de que el monto final sea el correcto
        montoAPagarFinal.text(`S/ ${totalPagarActual.toFixed(2)}`);
        montoYapeSimulado.text(`S/ ${totalPagarActual.toFixed(2)}`);
    });

    // 10. Lógica para mostrar mensajes
    function mostrarMensaje(elemento, mensaje, color) {
        elemento.text(mensaje).css('color', color).show();
    }

    // 11. Función para ocultar todas las secciones de pago y mostrar el mensaje final
    function ocultarTodoYMostrarConfirmacionFinal(idReserva) {
        opcionesMetodoPago.hide();
        seccionPagoTarjeta.hide();
        seccionPagoYape.hide();
        mensajeResultadoTarjeta.hide();
        mensajeResultadoYape.hide();
        reservaConfirmadaFinal.show();

        // Actualizar el botón de comprobante con el ID de reserva
        $('#btn-ver-comprobante').attr('href', `Codigo_PHP/generate_pdf.php?id_reserva=${idReserva}`);
    }

    // 12. Función para enviar los datos de la reserva y el pago a PHP
    // Se ha modificado para incluir tipo_pago y pago_exitoso
    function enviarReservaYPagoPHP(tipoPago, pagoExitoso) {
        const reservationData = {
            id_cliente: clienteData.id_cliente,
            fecha_recojo: $('#fechaRecojo').val(),
            hora_recojo: $('#horaRecojo').val(),
            total_pagar: totalPagarActual,
            productos: cart.map(item => ({
                id_producto: item.id_producto,
                cantidad: item.cantidad,
                precio: item.precio
            })),
            tipo_pago: tipoPago,     // Nuevo: el tipo de pago (ej. 'Tarjeta', 'Yape', 'Efectivo')
            pago_exitoso: pagoExitoso // Nuevo: booleano indicando si la simulación de pago fue exitosa
        };

        // Mostrar un SweetAlert de "procesando"
        Swal.fire({
            title: 'Procesando su reserva y pago...',
            text: 'Por favor, espere un momento.',
            allowOutsideClick: false,
            didOpen: () => {
                Swal.showLoading();
            }
        });

        $.ajax({
            url: 'Codigo_PHP/process_reservation.php',
            method: 'POST',
            contentType: 'application/json',
            data: JSON.stringify(reservationData),
            dataType: 'json',
            success: function (response) {
                Swal.close(); // Cerrar el SweetAlert de "procesando"
                if (response.success) {
                    localStorage.removeItem('cart'); // Limpiar carrito después de reservar
                    Swal.fire({
                        title: '¡Reserva Registrada!',
                        text: `Su reserva ha sido registrada con éxito. Estado: ${response.estado_reserva}. Tipo de Pago: ${response.tipo_pago}.`,
                        icon: 'success',
                        confirmButtonText: 'Aceptar'
                    }).then(() => {
                        // Si el pago fue electrónico y exitoso, se descargará el comprobante
                        if (response.estado_reserva === 'Confirmado') {
                            window.open(`Codigo_PHP/generate_pdf.php?id_reserva=${response.id_reserva}`, '_blank');
                        }
                        ocultarTodoYMostrarConfirmacionFinal(response.id_reserva); // Muestra el div final de confirmación
                    });
                } else {
                    Swal.fire({
                        title: 'Error al procesar la reserva',
                        text: response.message || 'Ocurrió un error desconocido al guardar la reserva.',
                        icon: 'error',
                        confirmButtonText: 'Entendido'
                    });
                    // Si falla el envío a PHP, mostrar de nuevo las opciones de pago
                    opcionesMetodoPago.show();
                }
            },
            error: function (xhr, status, error) {
                Swal.close(); // Cerrar el SweetAlert de "procesando"
                console.error('Error en la solicitud AJAX al procesar reserva:', error);
                Swal.fire({
                    title: 'Error de Conexión',
                    text: 'Ocurrió un error al intentar guardar su reserva. Por favor, intente de nuevo.',
                    icon: 'error',
                    confirmButtonText: 'Aceptar'
                });
                opcionesMetodoPago.show(); // Mostrar de nuevo las opciones de pago
            }
        });
    }

    // 13. Eventos de los botones de selección de método de pago
    btnElegirTarjeta.on('click', function () {
        opcionesMetodoPago.hide();
        seccionPagoYape.hide(); // Asegurarse de que Yape esté oculto
        mensajeResultadoYape.hide(); // Ocultar mensaje previo de Yape
        seccionPagoTarjeta.show();
        mensajeResultadoTarjeta.hide(); // Ocultar mensaje previo de tarjeta
    });

    btnElegirYape.on('click', function () {
        opcionesMetodoPago.hide();
        seccionPagoTarjeta.hide(); // Asegurarse de que tarjeta esté oculto
        mensajeResultadoTarjeta.hide(); // Ocultar mensaje previo de tarjeta
        seccionPagoYape.show();
        mensajeResultadoYape.hide(); // Ocultar mensaje previo de Yape
    });

    // Nuevo: Evento para el botón de Pagar en Efectivo
    btnElegirEfectivo.on('click', function () {
        Swal.fire({
            title: 'Confirmar Reserva',
            text: '¿Está seguro de que desea confirmar su reserva y pagar en efectivo al recoger?',
            icon: 'question',
            showCancelButton: true,
            confirmButtonColor: '#3085d6',
            cancelButtonColor: '#d33',
            confirmButtonText: 'Sí, confirmar',
            cancelButtonText: 'No, elegir otro método'
        }).then((result) => {
            if (result.isConfirmed) {
                // Al elegir efectivo, la simulación de pago se considera "no exitosa" en el momento
                // ya que el pago real ocurrirá después.
                enviarReservaYPagoPHP('Efectivo', false);
            }
        });
    });

    // 14. Lógica de Simulación para Tarjeta
    formPagoTarjetaSimulado.on('submit', function (event) {
        event.preventDefault();

        const numero = $('#tarjeta-numero').val().replace(/\s/g, '');
        const nombre = $('#tarjeta-nombre').val();
        const vencimiento = $('#tarjeta-vencimiento').val();
        const cvv = $('#tarjeta-cvv').val();

        if (numero.length < 13 || nombre.length === 0 || vencimiento.length !== 5 || cvv.length < 3) {
            mostrarMensaje(mensajeResultadoTarjeta, "Por favor, complete todos los campos de la tarjeta con datos válidos.", "red");
            return;
        }

        seccionPagoTarjeta.hide();
        mostrarMensaje(mensajeResultadoTarjeta, "Procesando su pago con tarjeta...", "blue");

        setTimeout(() => {
            const exito = Math.random() < 0.9; // 90% de éxito en la simulación

            if (exito) {
                mostrarMensaje(mensajeResultadoTarjeta, "¡Pago con tarjeta realizado con éxito! Un momento...", "green");
                enviarReservaYPagoPHP('Tarjeta', true); // Envía tipo_pago y pago_exitoso: true
            } else {
                mostrarMensaje(mensajeResultadoTarjeta, "Error al procesar el pago con tarjeta. Intente con otra tarjeta o método.", "red");
                seccionPagoTarjeta.show(); // Mostrar formulario de nuevo para reintentar
            }
        }, 2500);
    });

    // 15. Lógica de Simulación para Yape/Billetera Digital
    btnConfirmarYapeSimulado.on('click', function () {
        seccionPagoYape.hide();
        mostrarMensaje(mensajeResultadoYape, "Verificando su pago con billetera digital...", "blue");

        setTimeout(() => {
            const exito = Math.random() < 0.95; // 95% de éxito para Yape

            if (exito) {
                mostrarMensaje(mensajeResultadoYape, "¡Pago con Yape/Billetera Digital realizado con éxito! Un momento...", "green");
                enviarReservaYPagoPHP('Yape', true); // Envía tipo_pago y pago_exitoso: true
            } else {
                mostrarMensaje(mensajeResultadoYape, "No se pudo verificar el pago con Yape/Billetera Digital. Inténtelo de nuevo.", "red");
                seccionPagoYape.show(); // Mostrar de nuevo para reintentar
            }
        }, 3000);
    });

    // 16. **Llamada inicial para cargar el carrito y el stock al cargar la página.**
    fetchProductStocks();
});