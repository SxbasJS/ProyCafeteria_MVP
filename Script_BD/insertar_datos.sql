-- Insertar algunos datos iniciales (opcional, pero útil para probar) 
-- (Falta agregar mas) 

-- Categorías
INSERT INTO `categorias` (`nombre_categoria`) VALUES
('Desayuno'),
('Almuerzo'),
('Snacks'),
('Bebidas');

-- Productos (ejemplos, ajusta según tu carta)
INSERT INTO `productos` (`nombre_producto`, `descripcion`, `precio`, `id_categoria`, `stock_actual`, `imagen_url`) VALUES
('Sandwich de Pollo', 'Pan con pollo deshilachado y mayonesa', 7.50, 1, 10, 'url_imagen_sandwich.jpg'),
('Jugo de Naranja', 'Jugo natural de naranja', 5.00, 4, 15, 'url_imagen_jugo.jpg'),
('Menú del Día', 'Plato de fondo variable (ej. Ají de Gallina)', 12.00, 2, 8, 'url_imagen_menu.jpg'),
('Empanada de Carne', 'Empanada rellena de carne molida', 4.00, 3, 12, 'url_imagen_empanada.jpg');

-- Usuario administrador inicial (CAMBIA LA CONTRASEÑA EN PRODUCCIÓN)
-- Usa un password hash si vas a usar PHP como en el ejemplo (password_hash)
INSERT INTO `usuarios_admin` (`username`, `password`, `nombre`, `rol`) VALUES
('admin_cafeteria', 'hashed_password_aqui', 'Admin General', 'Admin');
-- Recuerda que 'hashed_password_aqui' debe ser el hash de una contraseña real, no el texto plano.