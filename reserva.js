// js/reserva.js

$(document).ready(function() {
    let cart = JSON.parse(localStorage.getItem('cart')) || [];
    let clienteData = null; // Para almacenar los datos del cliente validado

    // Función para calcular y mostrar el total
    function calculateAndDisplayTotal() {
        let total = 0;
        cart.forEach(item => {
            total += item.precio * item.cantidad;
        });
        $('#total-pagar').text(`S/ ${total.toFixed(2)}`);
    }

    // Función para cargar los productos del carrito en la pantalla de reserva
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
                <div class="card mb-2 product-in-cart" data-id="${item.id_producto}" data-original-stock="${item.stock_actual}">
                    <div class="card-body d-flex justify-content-between align-items-center">
                        <div>
                            <h5>${item.nombre_producto}</h5>
                            <p class="mb-0">Precio Unitario: S/ ${item.precio.toFixed(2)}</p>
                            <p class="mb-0 text-muted">Stock Disponible: <span class="product-available-stock">${item.stock_actual}</span></p>
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

    // Cargar el stock real de los productos para la validación antes de mostrar el carrito
    async function fetchProductStocks() {
        const productIds = cart.map(item => item.id_producto);
        if (productIds.length === 0) return;

        try {
            const response = await $.ajax({
                url: 'Codigo_PHP/get_products.php', // Usamos el mismo script que devuelve productos
                method: 'GET',
                data: { product_ids: productIds.join(',') }, // Podrías modificar get_products.php para aceptar múltiples IDs
                dataType: 'json'
            });

            // Para simplificar, asumimos que get_products.php devolverá todos los productos o podemos modificarlo para filtrar por IDs.
            // Por ahora, get_products.php devuelve todos y filtramos en JS. Lo ideal sería un nuevo endpoint get_product_stocks.php.
            // Para este ejemplo, haremos una llamada para cada producto o modificar get_products.php para filtrar por un array de IDs.
            // O, si get_products.php sin category_id devuelve todos, podemos mapear.
            
            // Si get_products.php devuelve todos los productos:
            // Mejorar: Se debería crear un endpoint `get_product_stock.php` que reciba un array de IDs.
            // Para este ejemplo, simularé que ya obtuvimos el stock correcto por producto.
            // REALMENTE, deberías consultar el stock de cada producto individualmente en el backend
            // o modificar get_products.php para aceptar una lista de IDs y devolver solo esos stocks.

            // Por la complejidad de modificar get_products.php para recibir una lista de IDs en este momento,
            // vamos a hacer una validación simple en el backend al procesar la reserva.
            // Por ahora, asumiremos que `item.stock_actual` en el carrito es el último conocido,
            // pero la validación final y crucial será en `process_reservation.php`.
            
            // Aquí, si tuvieras un endpoint que te diera el stock de productos específicos:
            // response.forEach(p => {
            //     let cartItem = cart.find(c => c.id_producto === p.id_producto);
            //     if (cartItem) {
            //         cartItem.stock_actual = p.stock_actual; // Actualizar el stock_actual en el carrito
            //     }
            // });

        } catch (error) {
            console.error("Error al obtener stock de productos:", error);
            alert("No se pudo verificar el stock de algunos productos. Intente de nuevo.");
            window.location.href = 'menu.html'; // Redirigir al menú si hay un problema
            return;
        }
        loadCartProducts(); // Cargar los productos del carrito después de intentar actualizar stocks
    }


    // Validar Código UTP
    $('#codigoUrbano').on('blur', function() { // Usar 'blur' para validar cuando el campo pierde el foco
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

    // Eventos para aumentar/disminuir cantidad
    $(document).on('click', '.increase-quantity', function() {
        const productId = $(this).data('id');
        let item = cart.find(i => i.id_producto === productId);
        if (item) {
             // Es CRUCIAL obtener el stock actual del servidor antes de permitir aumentar
             // Para esta demostración, no haremos otra llamada AJAX, confiaremos en lo que
             // se cargó inicialmente. La validación final la hará process_reservation.php
             // si el stock es crítico.
            if (item.cantidad < item.stock_actual) { // Validar contra el stock disponible
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
                 $('#reserved-products-list').append('<p id="empty-reservation-message" class="text-muted">No hay productos en el carrito para reservar.</p>');
                 $('#btn-confirmar').prop('disabled', true);
            }
        }
    });

    // Validación de fecha y hora
    $('#fechaRecojo, #horaRecojo').on('change', function() {
        const fecha = $('#fechaRecojo').val();
        const hora = $('#horaRecojo').val();
        const now = new Date();
        const selectedDateTime = new Date(`${fecha}T${hora}:00`);

        $('#fechaValidation').text('');
        $('#horaValidation').text('');

        // Validar que no sea una fecha pasada
        if (selectedDateTime < now && fecha !== '') {
            $('#fechaValidation').text('La fecha de recojo no puede ser en el pasado.').addClass('text-danger');
            return;
        }

        // Validar horario de 8 AM a 2 PM (14:00)
        const [hour, minute] = hora.split(':').map(Number);
        if (hora && (hour < 8 || hour >= 14 || (hour === 14 && minute > 0))) {
            $('#horaValidation').text('El horario de recojo debe ser entre 8:00 AM y 2:00 PM.').addClass('text-danger');
        } else if (fecha === now.toISOString().slice(0, 10) && selectedDateTime < now) {
             $('#horaValidation').text('La hora de recojo no puede ser en el pasado para hoy.').addClass('text-danger');
        } else {
            $('#horaValidation').text('');
        }
    });


    // Botón Cancelar Reserva
    $('#btn-cancelar').on('click', function() {
        if (confirm('¿Estás seguro de que deseas cancelar la reserva? El carrito se vaciará.')) {
            localStorage.removeItem('cart'); // Vaciar el carrito
            window.location.href = 'menu.html'; // Redirigir al menú
        }
    });

    // Enviar formulario de reserva
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
        if (hour < 8 || hour >= 14 || (hour === 14 && minute > 0)) {
            alert('El horario de recojo debe ser entre 8:00 AM y 2:00 PM.');
            return;
        }


        // Confirmación final del usuario
        if (!confirm('¿Confirma su reserva? Una vez confirmada, no podrá deshacerse.')) {
            return;
        }

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
                    alert('Reserva realizada con éxito. Generando PDF...');
                    localStorage.removeItem('cart'); // Limpiar carrito después de reservar
                    // Redirigir para descargar el PDF
                    window.open(`Codigo_PHP/generate_pdf.php?id_reserva=${response.id_reserva}`, '_blank');
                    // Opcional: Redirigir al menú después de un breve retraso
                    setTimeout(() => {
                        window.location.href = 'menu.html';
                    }, 2000);
                } else {
                    alert('Error al procesar la reserva: ' + response.message);
                }
            },
            error: function(xhr, status, error) {
                console.error('Error en la solicitud AJAX:', error);
                alert('Ocurrió un error al intentar procesar su reserva. Por favor, intente de nuevo.');
            }
        });
    });

    // Cargar productos del carrito al cargar la página de reserva
    // Primero, obtener el stock actual de cada producto desde la DB antes de mostrar
    // Esto es crucial para la lógica de aumentar/disminuir cantidad.
    // Una forma simple es recargar la info completa de productos que estaban en el carrito desde la BD.
    if (cart.length > 0) {
        const productIdsInCart = cart.map(item => item.id_producto);
        $.ajax({
            url: 'Codigo_PHP/get_products.php', // Reutilizamos este endpoint, podrías necesitar uno más específico
            method: 'GET',
            dataType: 'json',
            success: function(allProducts) { // Suponiendo que get_products.php devuelve todos los productos si no se especifica categoría
                cart = cart.map(cartItem => {
                    const productInfo = allProducts.find(p => p.id_producto === cartItem.id_producto);
                    if (productInfo) {
                        return {
                            ...cartItem,
                            stock_actual: productInfo.stock_actual // Actualizar stock_actual en el carrito
                        };
                    }
                    return cartItem; // Si no se encuentra, mantener el item como está
                }).filter(item => item.stock_actual !== undefined); // Eliminar si el producto no se encontró en la DB (ej. fue eliminado)

                // Ahora que el stock está actualizado en `cart`, cargamos los productos.
                loadCartProducts();
            },
            error: function(xhr, status, error) {
                console.error('Error al obtener el stock actual de los productos del carrito:', error);
                alert('No se pudo cargar la información de stock de los productos. Redirigiendo al menú.');
                localStorage.removeItem('cart');
                window.location.href = 'menu.html';
            }
        });
    } else {
        loadCartProducts(); // Si el carrito está vacío, solo mostrar el mensaje
    }
});