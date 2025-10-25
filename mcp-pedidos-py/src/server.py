#!/usr/bin/env python3
"""
MCP Pedidos Server - Orders Management MCP Server

Provides tools for querying and creating orders in PostgreSQL database.
"""

import asyncio
import logging
import os
import sys
from typing import Any, Sequence

import psycopg2
from dotenv import load_dotenv
from mcp.server import Server
from mcp.server.stdio import stdio_server
from mcp.types import Tool, TextContent

# Load environment variables
load_dotenv()

# Configure logging to stderr only
logging.basicConfig(
    level=logging.INFO,
    format="[mcp-pedidos-py] %(message)s",
    stream=sys.stderr,
)
logger = logging.getLogger(__name__)

# Database configuration
DB_CONFIG = {
    "host": os.getenv("DB_HOST", "localhost"),
    "port": int(os.getenv("DB_PORT", "5432")),
    "database": os.getenv("DB_NAME", "mcp_lab"),
    "user": os.getenv("DB_USER", "postgres"),
    "password": os.getenv("DB_PASSWORD", "postgres"),
}


class DatabaseConnection:
    """Manages PostgreSQL database connection."""

    def __init__(self) -> None:
        self.conn: psycopg2.extensions.connection | None = None

    def connect(self) -> None:
        """Establish database connection."""
        try:
            self.conn = psycopg2.connect(**DB_CONFIG)
            logger.info("Database connection established")
        except psycopg2.Error as e:
            logger.error(f"Database connection failed: {e}")
            raise

    def close(self) -> None:
        """Close database connection."""
        if self.conn:
            self.conn.close()
            logger.info("Database connection closed")

    def get_cursor(self) -> psycopg2.extensions.cursor:
        """Get a database cursor."""
        if not self.conn:
            raise RuntimeError("Database not connected")
        return self.conn.cursor()


# Global database connection
db = DatabaseConnection()


def pedidos_estado_por_id(pedido_id: int) -> dict[str, Any]:
    """
    Get order status by ID.

    Args:
        pedido_id: Order ID to query

    Returns:
        Dictionary with order details or error message
    """
    cursor = None
    try:
        cursor = db.get_cursor()
        query = """
            SELECT id, cliente, monto, estado, fecha
            FROM pedidos
            WHERE id = %s
        """
        cursor.execute(query, (pedido_id,))
        result = cursor.fetchone()

        if result is None:
            logger.warning(f"Order not found: {pedido_id}")
            return {"error": f"Pedido con ID {pedido_id} no encontrado"}

        order = {
            "id": result[0],
            "cliente": result[1],
            "monto": float(result[2]),
            "estado": result[3],
            "fecha": result[4].isoformat() if result[4] else None,
        }

        logger.info(f"Order retrieved: {pedido_id} - {order['estado']}")
        return order

    except psycopg2.Error as e:
        logger.error(f"Database error getting order {pedido_id}: {e}")
        return {"error": f"Error de base de datos: {str(e)}"}
    except Exception as e:
        logger.error(f"Unexpected error getting order {pedido_id}: {e}")
        return {"error": f"Error inesperado: {str(e)}"}
    finally:
        if cursor:
            cursor.close()


def pedidos_crear(cliente: str, monto: float) -> dict[str, Any]:
    """
    Create a new order.

    Args:
        cliente: Customer name
        monto: Order amount

    Returns:
        Dictionary with new order ID and success message
    """
    cursor = None
    try:
        # Validate inputs
        if not cliente or not cliente.strip():
            return {"error": "El nombre del cliente es requerido"}

        if monto <= 0:
            return {"error": "El monto debe ser mayor a 0"}

        cursor = db.get_cursor()
        query = """
            INSERT INTO pedidos (cliente, monto, estado)
            VALUES (%s, %s, 'pendiente')
            RETURNING id
        """
        cursor.execute(query, (cliente.strip(), monto))
        new_id = cursor.fetchone()[0]

        if db.conn:
            db.conn.commit()

        logger.info(f"Order created: ID {new_id} - {cliente} - ${monto}")

        return {
            "id": new_id,
            "mensaje": "Pedido creado exitosamente",
        }

    except psycopg2.Error as e:
        if db.conn:
            db.conn.rollback()
        logger.error(f"Database error creating order: {e}")
        return {"error": f"Error de base de datos: {str(e)}"}
    except Exception as e:
        if db.conn:
            db.conn.rollback()
        logger.error(f"Unexpected error creating order: {e}")
        return {"error": f"Error inesperado: {str(e)}"}
    finally:
        if cursor:
            cursor.close()


# Create MCP server
server = Server("mcp-pedidos-py")


@server.list_tools()
async def list_tools() -> list[Tool]:
    """List available tools."""
    return [
        Tool(
            name="pedidos_estado_por_id",
            description="Obtiene el estado de un pedido por su ID. Retorna los detalles completos del pedido incluyendo cliente, monto, estado y fecha.",
            inputSchema={
                "type": "object",
                "properties": {
                    "id": {
                        "type": "integer",
                        "description": "ID del pedido a consultar",
                        "minimum": 1,
                    }
                },
                "required": ["id"],
            },
        ),
        Tool(
            name="pedidos_crear",
            description="Crea un nuevo pedido con estado 'pendiente' y retorna su ID. El pedido se crea con los datos del cliente y monto especificados.",
            inputSchema={
                "type": "object",
                "properties": {
                    "cliente": {
                        "type": "string",
                        "description": "Nombre del cliente",
                        "minLength": 1,
                    },
                    "monto": {
                        "type": "number",
                        "description": "Monto del pedido (debe ser mayor a 0)",
                        "minimum": 0.01,
                    },
                },
                "required": ["cliente", "monto"],
            },
        ),
    ]


@server.call_tool()
async def call_tool(name: str, arguments: Any) -> Sequence[TextContent]:
    """Handle tool calls."""
    import json

    try:
        if name == "pedidos_estado_por_id":
            pedido_id = arguments.get("id")
            if pedido_id is None:
                raise ValueError("ID is required")

            result = pedidos_estado_por_id(pedido_id)
            return [TextContent(type="text", text=json.dumps(result, indent=2))]

        elif name == "pedidos_crear":
            cliente = arguments.get("cliente")
            monto = arguments.get("monto")

            if cliente is None:
                raise ValueError("cliente is required")
            if monto is None:
                raise ValueError("monto is required")

            result = pedidos_crear(cliente, monto)
            return [TextContent(type="text", text=json.dumps(result, indent=2))]

        else:
            raise ValueError(f"Unknown tool: {name}")

    except Exception as e:
        logger.error(f"Error executing tool {name}: {e}")
        error_response = {"error": str(e)}
        return [TextContent(type="text", text=json.dumps(error_response, indent=2))]


async def main() -> None:
    """Main server entry point."""
    logger.info("Starting MCP Pedidos server...")

    # Connect to database
    try:
        db.connect()
    except Exception as e:
        logger.error(f"Failed to connect to database: {e}")
        sys.exit(1)

    try:
        # Run the server
        async with stdio_server() as (read_stream, write_stream):
            logger.info("MCP Pedidos server started successfully")
            await server.run(
                read_stream,
                write_stream,
                server.create_initialization_options(),
            )
    except Exception as e:
        logger.error(f"Server error: {e}")
        raise
    finally:
        db.close()
        logger.info("MCP Pedidos server stopped")


if __name__ == "__main__":
    try:
        asyncio.run(main())
    except KeyboardInterrupt:
        logger.info("Server interrupted by user")
        sys.exit(0)
    except Exception as e:
        logger.error(f"Fatal error: {e}")
        sys.exit(1)
