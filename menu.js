// js/menu.js
$(document).ready(function() {
    let cart = JSON.parse(localStorage.getItem('cart')) || []; // Cargar carrito desde localStorage
    
    // Función para actualizar el carrito en el HTML y localStorage
    function updateCart() {
        $('#cart-items').empty();
        let total = 0;
        if (cart.length === 0) {
            $('#cart-items').append('<li class="list-group-item d-flex justify-content-between align-items-center" id="empty-cart-message">El carrito está vacío.</li>');
            $('#btn-reservar').prop('disabled', true); // Deshabilitar botón si el carrito está vacío
        } else {
            cart.forEach(item => {
                total += item.precio * item.cantidad;
                const cartItemHtml = `
                    <li class="list-group-item d-flex justify-content-between align-items-center">
                        <div>
                            ${item.nombre_producto} - S/ ${item.precio.toFixed(2)}
                            <br>
                            <small>Cantidad: ${item.cantidad}</small>
                        </div>
                        <button class="btn btn-danger btn-sm remove-from-cart" data-id="${item.id_producto}">
                            <i class="fas fa-times"></i>
                        </button>
                    </li>
                `;
                $('#cart-items').append(cartItemHtml);
            });
            $('#btn-reservar').prop('disabled', false); // Habilitar botón si hay ítems
        }
        $('#cart-total').text(`S/ ${total.toFixed(2)}`);
        localStorage.setItem('cart', JSON.stringify(cart)); // Guardar en localStorage
    }

    // Cargar categorías
    $.ajax({
        url: 'Codigo_PHP/get_categories.php',
        method: 'GET',
        dataType: 'json',
        success: function(categories) {
            let categoryTabsHtml = '';
            categories.forEach((category, index) => {
                categoryTabsHtml += `
                    <button class="btn btn-outline-danger me-2 category-btn" data-id="${category.id_categoria}">${category.nombre_categoria}</button>
                `;
            });
            $('#category-tabs').html(categoryTabsHtml);

            // Cargar productos de la primera categoría por defecto o todos si no hay categorías
            if (categories.length > 0) {
                $('.category-btn').first().addClass('active');
                loadProducts(categories[0].id_categoria);
            } else {
                loadProducts(0); // Cargar todos si no hay categorías definidas
            }
        },
        error: function(xhr, status, error) {
            console.error('Error al cargar categorías:', error);
            $('#category-tabs').html('<p class="text-danger">Error al cargar categorías.</p>');
        }
    });

    // Función para cargar productos
    function loadProducts(categoryId = 0) {
        $('#product-list').empty().html('<div class="col-12 text-center"><div class="spinner-border text-danger" role="status"><span class="visually-hidden">Cargando...</span></div></div>'); // Mostrar spinner
        $.ajax({
            url: 'Codigo_PHP/get_products.php',
            method: 'GET',
            data: { category_id: categoryId },
            dataType: 'json',
            success: function(products) {
                $('#product-list').empty(); // Limpiar spinner
                if (products.length === 0) {
                    $('#product-list').html('<p class="col-12 text-center text-muted">No hay productos disponibles en esta categoría.</p>');
                    return;
                }
                products.forEach(product => {
                    const productCardHtml = `
                        <div class="col-md-6 col-lg-4 mb-4">
                            <div class="card h-100 shadow-sm">
                                <img src="${product.imagen_url}" class="card-img-top" alt="${product.nombre_producto}">
                                <div class="card-body">
                                    <h5 class="card-title">${product.nombre_producto}</h5>
                                    <p class="card-text">${product.descripcion}</p>
                                    <p class="card-text">Precio: S/ ${parseFloat(product.precio).toFixed(2)}</p>

                                    <p class="card-text text-muted" id="stock-${product.id_producto}"><strong>Stock:</strong> ${product.stock_actual}</p>
                                    <button class="btn btn-success add-to-cart-btn" 
                                            data-id="${product.id_producto}" 
                                            data-name="${product.nombre_producto}" 
                                            data-price="${product.precio}" 
                                            data-stock="${product.stock_actual}"
                                            ${product.stock_actual <= 0 ? 'disabled' : ''}>
                                        <i class="fas fa-cart-plus"></i> ${product.stock_actual <= 0 ? 'Sin Stock' : 'Agregar'}
                                    </button>
                                </div>
                            </div>
                        </div>
                    `;
                    $('#product-list').append(productCardHtml);
                });
                updateCart(); // Actualizar carrito después de cargar productos
            },
            error: function(xhr, status, error) {
                console.error('Error al cargar productos:', error);
                $('#product-list').html('<p class="col-12 text-danger text-center">Error al cargar productos.</p>');
            }
        });
    }

    // Evento click en botones de categoría
    $(document).on('click', '.category-btn', function() {
        $('.category-btn').removeClass('active');
        $(this).addClass('active');
        const categoryId = $(this).data('id');
        loadProducts(categoryId);
    });

    // Evento click en botones "Agregar al Carrito"
    $(document).on('click', '.add-to-cart-btn', function() {
        const productId = $(this).data('id');
        const productName = $(this).data('name');
        const productPrice = parseFloat($(this).data('price'));
        let productStock = parseInt($(this).data('stock')); // Stock actual desde la DB al cargar

        let existingItem = cart.find(item => item.id_producto === productId);

        if (existingItem) {
            if (existingItem.cantidad < productStock) { // Validar contra el stock actual
                existingItem.cantidad++;
            } else {
                alert(`No hay más stock disponible para ${productName}.`);
                return;
            }
        } else {
            if (productStock > 0) { // Solo agregar si hay stock inicial
                cart.push({
                    id_producto: productId,
                    nombre_producto: productName,
                    precio: productPrice,
                    cantidad: 1
                });
            } else {
                alert(`${productName} está sin stock.`);
                return;
            }
        }
        updateCart();
    });

    // Evento click en botón "Eliminar del Carrito"
    $(document).on('click', '.remove-from-cart', function() {
        const productIdToRemove = $(this).data('id');
        cart = cart.filter(item => item.id_producto !== productIdToRemove);
        updateCart();
    });

    // Evento click en botón "Reservar"
    $('#btn-reservar').on('click', function() {
        if (cart.length > 0) {
            localStorage.setItem('cart', JSON.stringify(cart)); // Guardar el carrito final en localStorage
            window.location.href = 'Reserva.html'; // Redirigir a la página de reserva
        } else {
            alert('El carrito está vacío. Agregue productos antes de reservar.');
        }
    });

    // Inicializar el carrito al cargar la página
    updateCart();
});