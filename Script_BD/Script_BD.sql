-- Base de datos: cafeteria_db

-- Tabla: categorias 
CREATE TABLE `categorias` (
  `id_categoria` INT(11) PRIMARY KEY AUTO_INCREMENT,
  `nombre_categoria` VARCHAR(50) NOT NULL 
);

-- Tabla: productos 
CREATE TABLE `productos` (
  `id_producto` INT(11) PRIMARY KEY AUTO_INCREMENT,
  `nombre_producto` VARCHAR(100) NOT NULL,
  `descripcion` TEXT,
  `precio` DECIMAL(10,2) NOT NULL,
  `id_categoria` INT(11) NOT NULL,
  `stock_actual` INT(11) NOT NULL,
  `imagen_url` VARCHAR(255) NULL,
  FOREIGN KEY (`id_categoria`) REFERENCES `categorias`(`id_categoria`)
);

-- Tabla: clientes 
CREATE TABLE `clientes` (
  `id_cliente` INT(11) PRIMARY KEY AUTO_INCREMENT,
  `tipo_cliente` ENUM('Alumno', 'Docente', 'Administrativo') NOT NULL,
  `codigo_universitario` VARCHAR(50) UNIQUE NOT NULL, -- UNIQUE para asegurar que cada código sea único
  `nombre` VARCHAR(100) NOT NULL,
  `apellido` VARCHAR(100) NOT NULL,
  `email` VARCHAR(100) NULL,
  `celular` VARCHAR(15) NULL,
  `fecha_registro` DATETIME DEFAULT CURRENT_TIMESTAMP 
);

-- Tabla: reservas 
CREATE TABLE `reservas` (
  `id_reserva` INT(11) PRIMARY KEY AUTO_INCREMENT,
  `id_cliente` INT(11) NOT NULL,
  `fecha_reserva` DATE NOT NULL, -- Fecha de recojo
  `hora_reserva` TIME NOT NULL, -- Hora de recojo
  `estado_reserva` ENUM('Pendiente', 'Confirmada', 'Cancelada', 'Completada') NOT NULL DEFAULT 'Pendiente',
  `total_pagar` DECIMAL(10,2) NOT NULL,
  `tipo_pago` ENUM('Efectivo') NOT NULL DEFAULT 'Efectivo',
  `fecha_creacion` DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (`id_cliente`) REFERENCES `clientes`(`id_cliente`)
);

-- Tabla: detalle_reserva 
CREATE TABLE `detalle_reserva` (
  `id_detalle` INT(11) PRIMARY KEY AUTO_INCREMENT,
  `id_reserva` INT(11) NOT NULL,
  `id_producto` INT(11) NOT NULL,
  `cantidad` INT(11) NOT NULL,
  `precio_unitario` DECIMAL(10,2) NOT NULL, -- Precio del producto al momento de la reserva
  FOREIGN KEY (`id_reserva`) REFERENCES `reservas`(`id_reserva`),
  FOREIGN KEY (`id_producto`) REFERENCES `productos`(`id_producto`)
);

-- Tabla: usuarios_admin 
CREATE TABLE `usuarios_admin` (
  `id_usuario` INT(11) PRIMARY KEY AUTO_INCREMENT,
  `username` VARCHAR(50) UNIQUE NOT NULL,
  `password` VARCHAR(100) NOT NULL, -- Almacenar contraseñas HASHED
  `nombre` VARCHAR(100) NOT NULL,
  `rol` ENUM('Admin', 'Cajero') NOT NULL,
  `fecha_creacion` DATETIME DEFAULT CURRENT_TIMESTAMP 
);

