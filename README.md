# Multi-MCP Gateway System

Laboratory project implementing a microservices architecture with a gateway that routes requests to two specialized backend services via the Model Context Protocol (MCP).

## Architecture

```
Claude Desktop (stdio)
         ↓
    MCP Gateway
      ↙      ↘
  Ventas    Pedidos
      ↘      ↙
    PostgreSQL
```

**Services:**
- **Database:** PostgreSQL 15 (Docker) - Port 5432
- **Ventas:** Node.js/TypeScript service for sales data
- **Pedidos:** Python service for order management
- **Gateway:** Node.js/TypeScript gateway routing requests by prefix

**Routing:**
- `ventas_*` → Ventas Service (Node.js)
- `pedidos_*` → Pedidos Service (Python)

## Prerequisites

- **Docker Desktop** (must be running)
- **Node.js** 18+
- **Python** 3.11+
- **Git**
- **Claude Desktop**

## Setup Instructions

### 1. Clone Repository

```bash
git clone <repository-url>
cd mcp-lab
```

### 2. Database Setup

```bash
cd db
docker-compose up -d
docker exec -i mcp-postgres psql -U postgres -d mcp_lab < schema.sql
docker exec -i mcp-postgres psql -U postgres -d mcp_lab < seed_data.sql
cd ..
```

**Verify:**
```bash
docker exec mcp-postgres psql -U postgres -d mcp_lab -c "SELECT COUNT(*) FROM ventas;"
docker exec mcp-postgres psql -U postgres -d mcp_lab -c "SELECT COUNT(*) FROM pedidos;"
```

Expected: ~545 sales, 44 orders

### 3. Ventas Service (Node.js)

```bash
cd mcp-ventas-node
npm install
cp .env.example .env
# Edit .env if needed (defaults should work)
npm run build
cd ..
```

### 4. Pedidos Service (Python)

```bash
cd mcp-pedidos-py
python -m venv venv --copies
# Activate venv:
# Windows: venv\Scripts\activate
# Linux/macOS: source venv/bin/activate
pip install -r requirements.txt
cp .env.example .env
# Edit .env if needed (defaults should work)
cd ..
```

### 5. Gateway Configuration

```bash
cd mcp-gateway
npm install
cp .env.example .env
```

**Edit `mcp-gateway/.env` with ABSOLUTE paths:**

```env
# Backend Server Paths (MUST be absolute paths)
VENTAS_SERVER_PATH=/absolute/path/to/mcp-lab/mcp-ventas-node/dist/index.js
PEDIDOS_SERVER_PATH=/absolute/path/to/mcp-lab/mcp-pedidos-py/src/server.py

# Logging Configuration
LOG_LEVEL=info

# Request Configuration
REQUEST_TIMEOUT=30000

# Runtime Paths
NODE_PATH=node
PYTHON_PATH=/absolute/path/to/mcp-lab/mcp-pedidos-py/venv/Scripts/python.exe
```

**Windows Example:**
```env
VENTAS_SERVER_PATH=C:/Users/YourName/Documents/mcp-lab/mcp-ventas-node/dist/index.js
PEDIDOS_SERVER_PATH=C:/Users/YourName/Documents/mcp-lab/mcp-pedidos-py/src/server.py
PYTHON_PATH=C:/Users/YourName/Documents/mcp-lab/mcp-pedidos-py/venv/Scripts/python.exe
```

**Linux/macOS Example:**
```env
VENTAS_SERVER_PATH=/home/yourname/mcp-lab/mcp-ventas-node/dist/index.js
PEDIDOS_SERVER_PATH=/home/yourname/mcp-lab/mcp-pedidos-py/src/server.py
PYTHON_PATH=/home/yourname/mcp-lab/mcp-pedidos-py/venv/bin/python
```

**Important:**
- Use forward slashes `/` even on Windows
- Point to `dist/index.js` (compiled), not `src/index.ts`
- Point to Python inside the virtual environment

```bash
npm run build
cd ..
```

### 6. Configure Claude Desktop

Edit Claude Desktop configuration:
- **Windows:** `%APPDATA%\Claude\claude_desktop_config.json`
- **macOS:** `~/Library/Application Support/Claude/claude_desktop_config.json`
- **Linux:** `~/.config/Claude/claude_desktop_config.json`

```json
{
  "mcpServers": {
    "mcp-gateway": {
      "command": "node",
      "args": [
        "/PATH TO REPO/mcp-lab/mcp-gateway/dist/index.js"
      ]
    }
  }
}
```

**Windows Example:**
```json
{
  "mcpServers": {
    "mcp-gateway": {
      "command": "node",
      "args": [
        "C:/PATH TO REPO/mcp-lab/mcp-gateway/dist/index.js"
      ]
    }
  }
}
```

### 7. Start and Verify

1. **Restart Claude Desktop** completely (quit and reopen)
2. Go to **Settings → Developer → Local MCP Servers**
3. Verify **"mcp-gateway"** shows **"connected"** (green)

If disconnected, check logs: **Settings → Developer → View Logs**

### 8. Test Tools

In Claude Desktop, test each tool:

```
"What was the total sales from last month?"
"Show me sales for the last 7 days"
"Check the status of order 5"
"Create an order for Juan Perez with amount 500000"
```

## Available Tools

- **ventas_total_mes_anterior** - Total sales from previous month
- **ventas_por_dia** - Daily sales for last N days (default: 30)
- **pedidos_estado_por_id** - Query order status by ID
- **pedidos_crear** - Create new order

## Troubleshooting

### Gateway Disconnected

Check logs in Claude Desktop: **Settings → Developer → View Logs**

**Common issues:**
- Path in `claude_desktop_config.json` is not absolute
- Path points to `src/index.ts` instead of `dist/index.js`
- Gateway `.env` file has incorrect paths

### Error: spawn tsx ENOENT

- Ensure `NODE_PATH=node` in `mcp-gateway/.env`
- Ensure `VENTAS_SERVER_PATH` points to `dist/index.js`
- Rebuild: `cd mcp-gateway && npm run build`

### Database Connection Failed

```bash
docker ps  # Verify container is running
docker exec mcp-postgres psql -U postgres -d mcp_lab  # Test connection
```

### Tools Not Appearing

1. Verify gateway is "connected" in Claude Desktop
2. Restart Claude Desktop completely
3. Check backend services can start:
   ```bash
   cd mcp-ventas-node && node dist/index.js  # Ctrl+C to exit
   cd mcp-pedidos-py && python src/server.py  # Ctrl+C to exit
   ```

## Database Access

```bash
# Access psql shell
docker exec -it mcp-postgres psql -U postgres -d mcp_lab

# Common commands
\dt              # List tables
\d ventas        # Describe ventas table
\q               # Quit
```

## Project Structure

```
mcp-lab/
├── db/                    # PostgreSQL (Docker)
├── mcp-ventas-node/       # Ventas Service (Node.js)
├── mcp-pedidos-py/        # Pedidos Service (Python)
├── mcp-gateway/           # Gateway (Node.js)
└── README.md
```

## Connection Details

**Database:**
- Host: localhost
- Port: 5432
- Database: mcp_lab
- User: postgres
- Password: postgres

**Sample Data:**
- ~545 sales transactions (90 days)
- 44 orders (18 completed, 13 pending, 9 processing, 4 cancelled)
