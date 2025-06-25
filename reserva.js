// js/reserva.js

$(document).ready(function() {
    // 1. Declaración de variables globales dentro del scope de jQuery ready
    let cart = JSON.parse(localStorage.getItem('cart')) || [];
    let clienteData = null; // Para almacenar los datos del cliente validado

    // 2. Función para calcular y mostrar el total
    function calculateAndDisplayTotal() {
        let total = 0;
        cart.forEach(item => {
            total += item.precio * item.cantidad;
        });
        $('#total-pagar').text(`S/ ${total.toFixed(2)}`);
    }

    // 3. Función para cargar los productos del carrito en la pantalla de reserva
    function loadCartProducts() {
        $('#reserved-products-list').empty();
        if (cart.length === 0) {
            $('#reserved-products-list').append('<li class="list-group-item d-flex justify-content-between align-items-center" id="empty-reservation-message">No hay productos en el carrito para reservar.</li>');
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
        // No necesitamos recargar 'cart' desde localStorage aquí, ya se hizo al inicio del ready.
        // Pero si esta función pudiera ser llamada independientemente, se podría necesitar.
        // Para este flujo, 'cart' ya está actualizada con localStorage.

        const productIds = cart.map(item => item.id_producto);
        
        // Si el carrito está vacío, no se necesita hacer una llamada AJAX.
        if (productIds.length === 0) {
            loadCartProducts(); // Cargar la vista de carrito vacío
            return;
        }

        try {
            const response = await $.ajax({
                url: 'Codigo_PHP/get_products.php', // Asegúrate que este PHP acepta 'product_ids'
                method: 'GET',
                data: { product_ids: productIds.join(',') }, // Envía los IDs como string separado por comas
                dataType: 'json'
            });

            // Actualizar la variable 'cart' con el stock_actual real de la base de datos
            cart = cart.map(cartItem => {
                const foundProduct = response.find(p => p.id_producto == cartItem.id_producto); // Usar '==' por si los tipos no coinciden (string vs number)
                if (foundProduct) {
                    // Si encontramos el producto, le añadimos/actualizamos la propiedad stock_actual
                    return { 
                        ...cartItem, 
                        stock_actual: parseInt(foundProduct.stock_actual) 
                    };
                }
                // Si el producto del carrito no se encontró en la respuesta del backend,
                // significa que quizás fue eliminado de la DB. Lo devolvemos sin stock_actual para que filter lo quite.
                return cartItem; 
            }).filter(item => item.stock_actual !== undefined && item.stock_actual !== null); 
            // Filtra para eliminar productos que no tienen un stock_actual válido (ej. no encontrados en DB)

            // IMPORTANTE: Guardar el carrito actualizado con stocks en localStorage
            localStorage.setItem('cart', JSON.stringify(cart));

        } catch (error) {
            console.error("Error al obtener stock de productos:", error);
            alert("No se pudo verificar el stock de algunos productos. Intente de nuevo o contacte a soporte.");
            // Si hay un error crítico, deshabilitar botón y mostrar mensaje
            $('#btn-confirmar').prop('disabled', true);
            $('#reserved-products-list').empty().append('<p class="text-danger">Error al cargar productos. Por favor, intente de nuevo.</p>');
            return; 
        }

        // Después de que 'cart' ha sido actualizado con los stocks, cargar la vista del carrito
        loadCartProducts();
    }


    // 5. Validar Código UTP
    $('#codigoUrbano').on('blur', function() {
        const codigo = $(this).val();
        if (codigo.length > 0) {
            $.ajax({
                url: 'Codigo_PHP/get_client.php',
                method: 'GET',
                data: { codigo: codigo },
                dataType: 'json',
                success: function(response) {
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
                error: function(xhr, status, error) {
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
    $(document).on('click', '.increase-quantity', function() {
        const productId = $(this).data('id');
        let item = cart.find(i => i.id_producto === productId);
        if (item) {
            // Se valida contra el stock_actual que ya fue cargado por fetchProductStocks
            if (item.cantidad < item.stock_actual) { 
                item.cantidad++;
                $(this).siblings('.product-quantity').text(item.cantidad);
                calculateAndDisplayTotal();
                localStorage.setItem('cart', JSON.stringify(cart)); // Actualizar localStorage
            } else {
                alert(`No puedes agregar más de ${item.nombre_producto}. Stock máximo alcanzado.`);
            }
        }
    });

    $(document).on('click', '.decrease-quantity', function() {
        const productId = $(this).data('id');
        let itemIndex = cart.findIndex(i => i.id_producto === productId);
        if (itemIndex > -1) {
            if (cart[itemIndex].cantidad > 1) {
                cart[itemIndex].cantidad--;
                $(this).siblings('.product-quantity').text(cart[itemIndex].cantidad);
            } else {
                // Si la cantidad es 1 y se disminuye, se elimina del carrito
                cart.splice(itemIndex, 1);
                $(this).closest('.product-in-cart').remove(); // Eliminar visualmente
            }
            calculateAndDisplayTotal();
            localStorage.setItem('cart', JSON.stringify(cart)); // Actualizar localStorage
            if (cart.length === 0) {
                $('#reserved-products-list').append('<li class="list-group-item d-flex justify-content-between align-items-center" id="empty-reservation-message">El carrito está vacío.</li>');
                $('#btn-confirmar').prop('disabled', true);
            }
        }
    });

    // 7. Validación de fecha y hora
    $('#fechaRecojo, #horaRecojo').on('change', function() {
        const fecha = $('#fechaRecojo').val();
        const hora = $('#horaRecojo').val();
        const now = new Date();
        const selectedDateTime = new Date(`${fecha}T${hora}:00`);

        $('#fechaValidation').text('');
        $('#horaValidation').text('');

        // Validar que no sea una fecha pasada
        if (fecha && selectedDateTime < now) { // Solo validar si se ha seleccionado una fecha
            $('#fechaValidation').text('La fecha y hora de recojo no pueden ser en el pasado.').addClass('text-danger');
            return;
        }

        // Validar horario de 8 AM a 2 PM (14:00)
        const [hour, minute] = hora.split(':').map(Number);
        if (hora && (hour < 8 || hour > 14 || (hour === 14 && minute > 0))) { // Cambié >=14 por >14 para incluir las 14:00
            $('#horaValidation').text('El horario de recojo debe ser entre 8:00 AM y 2:00 PM.').addClass('text-danger');
        } else if (fecha === now.toISOString().slice(0, 10) && selectedDateTime < now) {
            // Revalidar para hoy si la hora ya pasó
            $('#horaValidation').text('La hora de recojo no puede ser en el pasado para hoy.').addClass('text-danger');
        } else {
            $('#horaValidation').text('');
        }
    });


    // 8. Botón Cancelar Reserva
$('#btn-cancelar').on('click', function() {
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

    // 9. Enviar formulario de reserva
    $('#reservation-form').on('submit', function(e) {
        e.preventDefault();

        // Validaciones finales antes de enviar
        if (!clienteData) {
            alert('Por favor, valide su código UTP.');
            $('#codigoUrbano').focus();
            return;
        }

        if (cart.length === 0) {
            alert('El carrito de reserva está vacío.');
            return;
        }

        const fechaRecojo = $('#fechaRecojo').val();
        const horaRecojo = $('#horaRecojo').val();

        // Revalidar fecha y hora por si acaso
        const now = new Date();
        const selectedDateTime = new Date(`${fechaRecojo}T${horaRecojo}:00`);
        const [hour, minute] = horaRecojo.split(':').map(Number);

        if (selectedDateTime < now) {
            alert('La fecha y hora de recojo no pueden ser en el pasado.');
            return;
        }
        if (hour < 8 || hour > 14 || (hour === 14 && minute > 0)) {
            alert('El horario de recojo debe ser entre 8:00 AM y 2:00 PM.');
            return;
        }

         // Confirmación final del usuario con SweetAlert
        Swal.fire({
            title: '¿Confirma su reserva?',
            text: 'Una vez confirmada, no podrá deshacerse.',
            icon: 'warning',
            showCancelButton: true,
            confirmButtonColor: '#3085d6',
            cancelButtonColor: '#d33',
            confirmButtonText: 'Sí, confirmar reserva',
            cancelButtonText: 'Cancelar'
        }).then((result) => {
            if (result.isConfirmed) {
                const reservationData = {
                    id_cliente: clienteData.id_cliente,
                    fecha_recojo: fechaRecojo,
                    hora_recojo: horaRecojo,
                    total_pagar: parseFloat($('#total-pagar').text().replace('S/ ', '')),
                    productos: cart.map(item => ({
                        id_producto: item.id_producto,
                        cantidad: item.cantidad,
                        precio: item.precio // Precio unitario al momento de la reserva
                    }))
                };

                $.ajax({
                    url: 'Codigo_PHP/process_reservation.php',
                    method: 'POST',
                    contentType: 'application/json',
                    data: JSON.stringify(reservationData),
                    dataType: 'json',
                    success: function(response) {
                        if (response.success) {
                            localStorage.removeItem('cart'); // Limpiar carrito después de reservar
                            // SweetAlert para confirmación exitosa
                            Swal.fire({
                                title: '¡Reserva Confirmada!',
                                text: 'Su reserva ha sido procesada con éxito. En breve se descargará su comprobante.',
                                icon: 'success',
                                confirmButtonText: 'Aceptar'
                            }).then(() => {
                                // Redirigir para descargar el PDF
                                window.open(`Codigo_PHP/generate_pdf.php?id_reserva=${response.id_reserva}`, '_blank');
                                // Opcional: Redirigir al menú después de un breve retraso
                                setTimeout(() => {
                                    window.location.href = 'menu.html';
                                }, 2000);
                            });
                        } else {
                            Swal.fire({
                                title: 'Error al procesar la reserva',
                                text: response.message || 'Ocurrió un error desconocido.',
                                icon: 'error',
                                confirmButtonText: 'Entendido'
                            });
                        }
                    },
                    error: function(xhr, status, error) {
                        console.error('Error en la solicitud AJAX:', error);
                        Swal.fire({
                            title: 'Error de Conexión',
                            text: 'Ocurrió un error al intentar procesar su reserva. Por favor, intente de nuevo.',
                            icon: 'error',
                            confirmButtonText: 'Aceptar'
                        });
                    }
                });
            }
        });
    });

    // 10. **Llamada inicial para cargar el carrito y el stock al cargar la página.**
    // Esta es la única llamada necesaria para iniciar el proceso.
    fetchProductStocks(); 
    
});