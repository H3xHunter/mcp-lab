# MCP Pedidos Python - Orders MCP Server

A Python-based Model Context Protocol (MCP) server that provides tools for managing orders in a PostgreSQL database.

## Description

This MCP server exposes two tools for managing order data:
- Query order status by ID
- Create new orders

The server communicates via stdio following the MCP protocol and connects to a PostgreSQL database to store and retrieve order information.

## Available Tools

### 1. pedidos_estado_por_id

Gets the status and details of an order by its ID.

**Parameters:**
- `id` (integer, required): Order ID to query

**Returns:**
```json
{
  "id": 1,
  "cliente": "Juan Perez",
  "monto": 150000,
  "estado": "completado",
  "fecha": "2025-10-20T00:00:00"
}
```

**Error Response:**
```json
{
  "error": "Pedido con ID 999 no encontrado"
}
```

**Example usage:**
```json
{
  "name": "pedidos_estado_por_id",
  "arguments": {
    "id": 1
  }
}
```

### 2. pedidos_crear

Creates a new order with "pendiente" (pending) status and returns the new order ID.

**Parameters:**
- `cliente` (string, required): Customer name
- `monto` (number, required): Order amount (must be greater than 0)

**Returns:**
```json
{
  "id": 42,
  "mensaje": "Pedido creado exitosamente"
}
```

**Error Response:**
```json
{
  "error": "El monto debe ser mayor a 0"
}
```

**Example usage:**
```json
{
  "name": "pedidos_crear",
  "arguments": {
    "cliente": "Maria Garcia",
    "monto": 75000.50
  }
}
```

## Setup Instructions

### Prerequisites

- Python 3.11 or higher
- PostgreSQL database with a `pedidos` table
- pip package manager

### Database Schema

The server expects a `pedidos` table with at least the following structure:

```sql
CREATE TABLE pedidos (
  id SERIAL PRIMARY KEY,
  cliente VARCHAR(255) NOT NULL,
  monto NUMERIC(10, 2) NOT NULL,
  estado VARCHAR(50) NOT NULL DEFAULT 'pendiente',
  fecha TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

### Installation

1. Clone the repository and navigate to the project directory:
```bash
cd mcp-pedidos-py
```

2. Create a virtual environment:
```bash
python -m venv venv
```

3. Activate the virtual environment:

**On Linux/macOS:**
```bash
source venv/bin/activate
```

**On Windows:**
```cmd
venv\Scriptsctivate
```

4. Install dependencies:
```bash
pip install -r requirements.txt
```

5. Configure environment variables:
```bash
cp .env.example .env
```

6. Edit `.env` with your database credentials.

## Running the Server

Run the server directly:
```bash
python src/server.py
```

## Testing the Server Standalone

Using MCP Inspector:
```bash
npx @modelcontextprotocol/inspector python src/server.py
```

## Integration with Claude Desktop

Add to Claude Desktop config (Windows: %APPDATA%\Claude\claude_desktop_config.json):

```json
{
  "mcpServers": {
    "pedidos": {
      "command": "python",
      "args": ["C:/path/to/mcp-pedidos-py/src/server.py"],
      "env": {
        "DB_HOST": "localhost",
        "DB_PORT": "5432",
        "DB_NAME": "mcp_lab",
        "DB_USER": "postgres",
        "DB_PASSWORD": "postgres"
      }
    }
  }
}
```

## Troubleshooting

See full troubleshooting guide in the documentation.

## License

MIT
