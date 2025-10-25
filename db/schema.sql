-- MCP Lab Database Schema
-- This script creates the database schema for the MCP Lab project
-- Tables: ventas (sales), pedidos (orders)

-- Drop tables if they exist (for clean setup)
DROP TABLE IF EXISTS ventas CASCADE;
DROP TABLE IF EXISTS pedidos CASCADE;

-- Table: ventas (sales)
-- Stores sales transactions with date, amount, and description
CREATE TABLE ventas (
    id SERIAL PRIMARY KEY,
    fecha DATE NOT NULL,
    monto DECIMAL(10,2) NOT NULL CHECK (monto >= 0),
    descripcion VARCHAR(255),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Table: pedidos (orders)
-- Stores customer orders with status tracking
CREATE TABLE pedidos (
    id SERIAL PRIMARY KEY,
    cliente VARCHAR(255) NOT NULL,
    monto DECIMAL(10,2) NOT NULL CHECK (monto >= 0),
    estado VARCHAR(50) NOT NULL DEFAULT 'pendiente',
    fecha TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT check_estado CHECK (estado IN ('pendiente', 'procesando', 'completado', 'cancelado'))
);

-- Indexes for performance
-- Index on ventas fecha for date-range queries
CREATE INDEX idx_ventas_fecha ON ventas(fecha);

-- Index on pedidos estado for filtering by status
CREATE INDEX idx_pedidos_estado ON pedidos(estado);

-- Index on pedidos fecha for date-range queries
CREATE INDEX idx_pedidos_fecha ON pedidos(fecha);

-- Comments for documentation
COMMENT ON TABLE ventas IS 'Sales transactions table';
COMMENT ON COLUMN ventas.fecha IS 'Date of the sale';
COMMENT ON COLUMN ventas.monto IS 'Sale amount in Colombian Pesos (COP)';
COMMENT ON COLUMN ventas.descripcion IS 'Optional description of the sale';

COMMENT ON TABLE pedidos IS 'Customer orders table';
COMMENT ON COLUMN pedidos.cliente IS 'Customer name';
COMMENT ON COLUMN pedidos.monto IS 'Order amount in Colombian Pesos (COP)';
COMMENT ON COLUMN pedidos.estado IS 'Order status: pendiente, procesando, completado, cancelado';
COMMENT ON COLUMN pedidos.fecha IS 'Order creation timestamp';
