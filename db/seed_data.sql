-- MCP Lab Seed Data
-- This script populates the database with realistic sample data
-- Includes 90+ days of sales data and 30+ orders

-- Clear existing data
TRUNCATE TABLE ventas RESTART IDENTITY CASCADE;
TRUNCATE TABLE pedidos RESTART IDENTITY CASCADE;

-- ============================================================================
-- VENTAS (SALES) DATA
-- ============================================================================
-- Generate 90 days of sales data with multiple transactions per day
-- Amounts in Colombian Pesos (COP): 50,000 to 5,000,000 range

-- Daily sales with varying amounts (3-10 transactions per day)
INSERT INTO ventas (fecha, monto, descripcion)
SELECT
    (CURRENT_DATE - (day_offset || ' days')::INTERVAL)::DATE,
    (random() * 4950000 + 50000)::DECIMAL(10,2),
    CASE
        WHEN random() < 0.2 THEN 'Venta de productos electrónicos'
        WHEN random() < 0.4 THEN 'Venta de ropa y accesorios'
        WHEN random() < 0.6 THEN 'Venta de alimentos y bebidas'
        WHEN random() < 0.8 THEN 'Venta de artículos para el hogar'
        ELSE 'Venta de servicios'
    END
FROM generate_series(0, 89) AS day_offset,
     generate_series(1, (3 + floor(random() * 8)::INT)) AS transaction_num;

-- Add some specific high-value sales
INSERT INTO ventas (fecha, monto, descripcion) VALUES
(CURRENT_DATE - INTERVAL '5 days', 8500000.00, 'Venta especial - Equipo industrial'),
(CURRENT_DATE - INTERVAL '12 days', 7200000.00, 'Venta especial - Sistema de cómputo'),
(CURRENT_DATE - INTERVAL '25 days', 9100000.00, 'Venta especial - Maquinaria'),
(CURRENT_DATE - INTERVAL '45 days', 6800000.00, 'Venta especial - Mobiliario oficina'),
(CURRENT_DATE - INTERVAL '60 days', 7500000.00, 'Venta especial - Equipamiento médico');

-- ============================================================================
-- PEDIDOS (ORDERS) DATA
-- ============================================================================
-- 40+ orders with varied status and Colombian names
-- Status distribution: 40% completado, 30% pendiente, 20% procesando, 10% cancelado

-- Completado orders (40%)
INSERT INTO pedidos (cliente, monto, estado, fecha) VALUES
('Juan Pérez Rodríguez', 250000.00, 'completado', CURRENT_TIMESTAMP - INTERVAL '58 days'),
('María García López', 420000.00, 'completado', CURRENT_TIMESTAMP - INTERVAL '55 days'),
('Carlos Martínez Sánchez', 185000.00, 'completado', CURRENT_TIMESTAMP - INTERVAL '52 days'),
('Ana Sofía González', 670000.00, 'completado', CURRENT_TIMESTAMP - INTERVAL '48 days'),
('Diego Hernández Díaz', 320000.00, 'completado', CURRENT_TIMESTAMP - INTERVAL '45 days'),
('Laura Valentina Ramírez', 890000.00, 'completado', CURRENT_TIMESTAMP - INTERVAL '42 days'),
('Andrés Felipe Torres', 155000.00, 'completado', CURRENT_TIMESTAMP - INTERVAL '38 days'),
('Camila Rodríguez Castro', 520000.00, 'completado', CURRENT_TIMESTAMP - INTERVAL '35 days'),
('Santiago Vargas Moreno', 730000.00, 'completado', CURRENT_TIMESTAMP - INTERVAL '32 days'),
('Isabella Gómez Ruiz', 285000.00, 'completado', CURRENT_TIMESTAMP - INTERVAL '28 days'),
('Mateo Jiménez Ortiz', 410000.00, 'completado', CURRENT_TIMESTAMP - INTERVAL '25 days'),
('Sofía Muñoz Herrera', 560000.00, 'completado', CURRENT_TIMESTAMP - INTERVAL '22 days'),
('Sebastián Rojas Mendoza', 195000.00, 'completado', CURRENT_TIMESTAMP - INTERVAL '18 days'),
('Valentina Cruz Silva', 825000.00, 'completado', CURRENT_TIMESTAMP - INTERVAL '15 days'),
('Daniel Ospina Ríos', 340000.00, 'completado', CURRENT_TIMESTAMP - INTERVAL '12 days'),
('Mariana Parra Aguilar', 475000.00, 'completado', CURRENT_TIMESTAMP - INTERVAL '8 days'),
('Nicolás Salazar Vega', 920000.00, 'completado', CURRENT_TIMESTAMP - INTERVAL '5 days');

-- Pendiente orders (30%)
INSERT INTO pedidos (cliente, monto, estado, fecha) VALUES
('Gabriela Medina Suárez', 380000.00, 'pendiente', CURRENT_TIMESTAMP - INTERVAL '4 days'),
('Lucas Navarro Peña', 625000.00, 'pendiente', CURRENT_TIMESTAMP - INTERVAL '3 days 18 hours'),
('Victoria Castillo Ramos', 210000.00, 'pendiente', CURRENT_TIMESTAMP - INTERVAL '3 days 12 hours'),
('Emiliano Reyes Flores', 540000.00, 'pendiente', CURRENT_TIMESTAMP - INTERVAL '2 days 20 hours'),
('Valeria Mejía Guerrero', 785000.00, 'pendiente', CURRENT_TIMESTAMP - INTERVAL '2 days 8 hours'),
('Joaquín Gutiérrez Romero', 155000.00, 'pendiente', CURRENT_TIMESTAMP - INTERVAL '1 day 16 hours'),
('Luciana Arias Cardona', 430000.00, 'pendiente', CURRENT_TIMESTAMP - INTERVAL '1 day 4 hours'),
('Benjamín Morales Duarte', 690000.00, 'pendiente', CURRENT_TIMESTAMP - INTERVAL '20 hours'),
('Emma Silva Acosta', 275000.00, 'pendiente', CURRENT_TIMESTAMP - INTERVAL '12 hours'),
('Tomás Velásquez Cano', 520000.00, 'pendiente', CURRENT_TIMESTAMP - INTERVAL '6 hours'),
('Renata Fernández Lara', 840000.00, 'pendiente', CURRENT_TIMESTAMP - INTERVAL '3 hours'),
('Maximiliano Cortés Vera', 195000.00, 'pendiente', CURRENT_TIMESTAMP - INTERVAL '1 hour');

-- Procesando orders (20%)
INSERT INTO pedidos (cliente, monto, estado, fecha) VALUES
('Catalina Blanco Pacheco', 365000.00, 'procesando', CURRENT_TIMESTAMP - INTERVAL '8 days'),
('Felipe Delgado Fuentes', 580000.00, 'procesando', CURRENT_TIMESTAMP - INTERVAL '6 days'),
('Amanda Peña Molina', 245000.00, 'procesando', CURRENT_TIMESTAMP - INTERVAL '5 days 12 hours'),
('Leonardo Campos Zambrano', 710000.00, 'procesando', CURRENT_TIMESTAMP - INTERVAL '4 days 18 hours'),
('Violeta Soto Marín', 425000.00, 'procesando', CURRENT_TIMESTAMP - INTERVAL '3 days 20 hours'),
('Matías Rubio Carrillo', 890000.00, 'procesando', CURRENT_TIMESTAMP - INTERVAL '2 days 14 hours'),
('Julieta Escobar Pineda', 320000.00, 'procesando', CURRENT_TIMESTAMP - INTERVAL '1 day 22 hours'),
('Ignacio Mendoza Barrera', 555000.00, 'procesando', CURRENT_TIMESTAMP - INTERVAL '1 day 10 hours');

-- Cancelado orders (10%)
INSERT INTO pedidos (cliente, monto, estado, fecha) VALUES
('Antonia Vargas León', 290000.00, 'cancelado', CURRENT_TIMESTAMP - INTERVAL '30 days'),
('Francisco Rincón Paredes', 475000.00, 'cancelado', CURRENT_TIMESTAMP - INTERVAL '20 days'),
('Regina Castaño Nieto', 630000.00, 'cancelado', CURRENT_TIMESTAMP - INTERVAL '15 days'),
('Rodrigo Alvarado Ibáñez', 185000.00, 'cancelado', CURRENT_TIMESTAMP - INTERVAL '10 days');

-- Add some high-value orders
INSERT INTO pedidos (cliente, monto, estado, fecha) VALUES
('Corporación XYZ Ltda', 15500000.00, 'completado', CURRENT_TIMESTAMP - INTERVAL '40 days'),
('Inversiones ABC S.A.S', 18200000.00, 'procesando', CURRENT_TIMESTAMP - INTERVAL '7 days'),
('Distribuidora Nacional', 12800000.00, 'pendiente', CURRENT_TIMESTAMP - INTERVAL '2 days');

-- Summary comment
-- Total records created:
-- Ventas: ~450-900 transactions (90 days x 3-10 per day) + 5 special sales
-- Pedidos: 44 orders (17 completado, 12 pendiente, 8 procesando, 4 cancelado, 3 high-value)
