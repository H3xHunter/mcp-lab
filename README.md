# Multi-MCP Gateway System

## Project Overview

Laboratory project implementing a microservices architecture with a gateway that routes requests to two specialized backend services via the Model Context Protocol (MCP).

**Services:**

| Service | Technology | Port | Database |
|---------|-----------|------|----------|
| Database | PostgreSQL 15 (Docker) | 5432 | mcp_lab |
| Ventas | Node.js/TypeScript | - | PostgreSQL |
| Pedidos | Python 3.11+ | - | PostgreSQL |
| Gateway | Node.js/TypeScript | - | N/A |

The gateway exposes a unified catalog of tools to Claude Desktop and routes requests by prefix.

## Architecture Diagram

```
Claude Desktop (stdio)
         ↓
    MCP Gateway
      ↙      ↘
  Ventas    Pedidos
      ↘      ↙
    PostgreSQL
```

**Routing by prefix:**
- `ventas_*` → Ventas Service (Node.js)
- `pedidos_*` → Pedidos Service (Python)

## Technology Stack

- **Node.js** 18+ (TypeScript)
- **Python** 3.11+
- **PostgreSQL** 15 (Docker)
- **Model Context Protocol** (MCP SDK)
- **Docker & Docker Compose**

## Prerequisites

- **Java 21** (for some tools, if needed)
- **Maven** (if applicable)
- **Docker & Docker Compose**
- **Git**
- **Node.js** 18+
- **Python** 3.11+
- **Claude Desktop** application

## Setup Instructions

Follow these steps in order to set up the entire system.

### 1. Clone the Repository

```bash
git clone <repository-url>
cd mcp-lab
```

### 2. Database Setup

Start PostgreSQL using Docker Compose and load the schema and seed data:

```bash
# Navigate to database directory
cd db

# Start PostgreSQL container
docker-compose up -d

# Wait a few seconds for PostgreSQL to initialize, then load schema
docker exec -i mcp-postgres psql -U postgres -d mcp_lab < schema.sql

# Load seed data
docker exec -i mcp-postgres psql -U postgres -d mcp_lab < seed_data.sql

# Verify database is running
docker-compose ps

# Return to project root
cd ..
```

**Verify data loaded:**
```bash
docker exec -it mcp-postgres psql -U postgres -d mcp_lab -c "SELECT COUNT(*) FROM ventas;"
docker exec -it mcp-postgres psql -U postgres -d mcp_lab -c "SELECT COUNT(*) FROM pedidos;"
```

### 3. Ventas Service Setup (Node.js)

```bash
# Navigate to ventas service
cd mcp-ventas-node

# Install dependencies
npm install

# Configure environment
cp .env.example .env
# Edit .env with database credentials (default values should work)

# Build TypeScript
npm run build

# Return to project root
cd ..
```

### 4. Pedidos Service Setup (Python)

```bash
# Navigate to pedidos service
cd mcp-pedidos-py

# Create virtual environment (Windows note: use --copies flag)
python -m venv venv --copies

# Activate virtual environment
# Windows:
venv\Scripts\activate
# Linux/macOS:
source venv/bin/activate

# Install dependencies
pip install -r requirements.txt

# Configure environment
cp .env.example .env
# Edit .env with database credentials (default values should work)

# Return to project root (deactivate venv if desired)
cd ..
```

### 5. Gateway Setup

```bash
# Navigate to gateway
cd mcp-gateway

# Install dependencies
npm install

# Configure environment
cp .env.example .env
# Edit .env to set absolute paths to backend services

# Build TypeScript
npm run build

# Return to project root
cd ..
```

### 6. Configure Claude Desktop

Edit Claude Desktop configuration file:

- **Windows:** `%APPDATA%\Claude\claude_desktop_config.json`
- **macOS:** `~/Library/Application Support/Claude/claude_desktop_config.json`
- **Linux:** `~/.config/Claude/claude_desktop_config.json`

Add the gateway configuration:

```json
{
  "mcpServers": {
    "mcp-gateway": {
      "command": "node",
      "args": [
        "C:/Users/Tomas/Documents/University/7thSemester/ImplementacionSoftware/mcp-lab/mcp-gateway/dist/index.js"
      ]
    }
  }
}
```

**IMPORTANT:** Use absolute paths, not relative paths. Adjust the path to match your system.

### 7. Start Services

Start services in the correct order:

1. **Database is already running** (from step 2)
2. **Backend services** are spawned automatically by the gateway
3. **Gateway** is started automatically when Claude Desktop connects

### 8. Verify Everything is Running

1. Restart Claude Desktop completely (quit and reopen)
2. Go to **Settings → Developer → Local MCP Servers**
3. Verify that **"mcp-gateway"** appears with status **"connected"**
4. In a new chat, test the tools:
   - "What was the total sales from last month?"
   - "Show me sales for the last 7 days"
   - "Check the status of order 5"
   - "Create an order for Juan Perez with amount 500000"

If any tools fail, check the Troubleshooting section below.

## API Endpoints

### Gateway Routing Configuration

The gateway uses prefix-based routing:

| Prefix | Backend Service | Transport |
|--------|----------------|-----------|
| `ventas_*` | mcp-ventas-node | stdio (subprocess) |
| `pedidos_*` | mcp-pedidos-py | stdio (subprocess) |

### Ventas Service Endpoints

**Tool: `ventas_total_mes_anterior`**

Calculates total sales for the previous month.

- **Parameters:** None
- **Returns:**
  ```json
  {
    "mes": "2025-09",
    "total": 150000.50
  }
  ```

**Tool: `ventas_por_dia`**

Gets daily sales series for the last N days.

- **Parameters:**
  - `n` (number, optional): Days to look back (default: 30, max: 365)
- **Returns:**
  ```json
  [
    { "fecha": "2025-10-01", "total": 5000.00 },
    { "fecha": "2025-10-02", "total": 7500.50 }
  ]
  ```

### Pedidos Service Endpoints

**Tool: `pedidos_estado_por_id`**

Query order status and details by ID.

- **Parameters:**
  - `id` (integer, required): Order ID to query
- **Returns:**
  ```json
  {
    "id": 1,
    "cliente": "Juan Perez",
    "monto": 150000,
    "estado": "completado",
    "fecha": "2025-10-20T00:00:00"
  }
  ```

**Tool: `pedidos_crear`**

Create new order with "pendiente" status.

- **Parameters:**
  - `cliente` (string, required): Customer name
  - `monto` (number, required): Order amount (must be > 0)
- **Returns:**
  ```json
  {
    "id": 42,
    "mensaje": "Pedido creado exitosamente"
  }
  ```

### Example Commands

Test the system with these prompts in Claude Desktop:

- "What was the total sales from last month?"
- "Show me the sales for the last 7 days"
- "Check the status of order 5"
- "Create an order for Maria Garcia with amount 250000"

## Database Management

### Connection Details

| Parameter | Value |
|-----------|-------|
| Host | localhost |
| Port | 5432 |
| Database | mcp_lab |
| User | postgres |
| Password | postgres |
| Connection String | `postgresql://postgres:postgres@localhost:5432/mcp_lab` |

### Database Schema

**ventas (sales) table:**
```sql
id          SERIAL PRIMARY KEY
fecha       DATE NOT NULL
monto       DECIMAL(10,2) NOT NULL CHECK (monto >= 0)
descripcion VARCHAR(255)
created_at  TIMESTAMP DEFAULT CURRENT_TIMESTAMP
```

**pedidos (orders) table:**
```sql
id      SERIAL PRIMARY KEY
cliente VARCHAR(255) NOT NULL
monto   DECIMAL(10,2) NOT NULL CHECK (monto >= 0)
estado  VARCHAR(50) NOT NULL DEFAULT 'pendiente'
fecha   TIMESTAMP DEFAULT CURRENT_TIMESTAMP
```

**Valid order states:** 'pendiente', 'procesando', 'completado', 'cancelado'

### How to Access Databases

**Access psql shell:**
```bash
docker exec -it mcp-postgres psql -U postgres -d mcp_lab
```

**Common psql commands:**
```sql
\dt              -- List all tables
\d ventas        -- Describe ventas table
\d pedidos       -- Describe pedidos table
\q               -- Quit psql
```

**Sample queries:**
```sql
-- Check sales data
SELECT COUNT(*) FROM ventas;
SELECT fecha, SUM(monto) as total FROM ventas GROUP BY fecha ORDER BY fecha DESC LIMIT 10;

-- Check orders data
SELECT COUNT(*) FROM pedidos;
SELECT estado, COUNT(*) as cantidad FROM pedidos GROUP BY estado;
```

**Backup database:**
```bash
docker exec mcp-postgres pg_dump -U postgres mcp_lab > backup_$(date +%Y%m%d_%H%M%S).sql
```

**Restore from backup:**
```bash
docker exec -i mcp-postgres psql -U postgres -d mcp_lab < backup_file.sql
```

## Troubleshooting

### Common Issues and Solutions

**"Gateway disconnected" in Claude Desktop:**
- Verify absolute path in `claude_desktop_config.json`
- Check that the path points to `mcp-gateway/dist/index.js`
- Restart Claude Desktop completely
- Review gateway logs (stderr output)

**"Database connection failed":**
- Verify PostgreSQL is running: `docker ps`
- Check that container `mcp-postgres` is up
- Review database credentials in `.env` files (both services)
- Test connection: `docker exec -it mcp-postgres psql -U postgres -d mcp_lab`

**"Module not found" errors:**
- Node.js service: Run `npm install` in the service directory
- Python service: Activate venv and run `pip install -r requirements.txt`
- Verify Node.js version: `node --version` (requires 18+)
- Verify Python version: `python --version` (requires 3.11+)

**"Backend is not ready":**
- Test each backend service individually before using gateway
- Verify database has seed data loaded
- Check backend paths in gateway `.env` configuration
- Review stderr logs from each component

**Python venv issues on Windows:**
- Use `python -m venv venv --copies` instead of `python -m venv venv`
- Activate with `venv\Scripts\activate` (backslash, not forward slash)

### Port Conflicts

**Port 5432 already in use:**

1. Check if PostgreSQL is running locally:
   ```bash
   # Windows
   netstat -ano | findstr :5432

   # Linux/macOS
   lsof -i :5432
   ```

2. Stop local PostgreSQL:
   ```bash
   # Windows (run as Administrator)
   net stop postgresql-x64-15

   # Linux
   sudo systemctl stop postgresql

   # macOS
   brew services stop postgresql
   ```

3. Or change Docker port in `docker-compose.yml`:
   ```yaml
   ports:
     - "5433:5432"  # Use port 5433 instead
   ```
   Then update `.env` files to use port 5433.

### Database Connection Problems

**Connection Refused:**

1. Check container is running: `docker-compose ps`
2. Check container health: `docker inspect mcp-postgres --format='{{.State.Health.Status}}'`
3. View logs: `docker-compose logs postgres`
4. Restart container: `docker-compose restart`
5. Ensure Docker Desktop is running (Windows/macOS)

**Reset Database (nuclear option):**

```bash
cd db
docker-compose down -v  # WARNING: Deletes all data!
docker-compose up -d
docker exec -i mcp-postgres psql -U postgres -d mcp_lab < schema.sql
docker exec -i mcp-postgres psql -U postgres -d mcp_lab < seed_data.sql
```

### Service Registration Issues

**Tools not appearing in Claude Desktop:**

1. Verify gateway shows "connected" status
2. Restart Claude Desktop completely
3. Check that backend services can start independently:
   ```bash
   # Test Ventas
   cd mcp-ventas-node
   node dist/index.js
   # Press Ctrl+C after seeing it starts

   # Test Pedidos
   cd mcp-pedidos-py
   python src/server.py
   # Press Ctrl+C after seeing it starts
   ```
4. Review gateway configuration in `.env`

## Project Structure

```
mcp-lab/
├── db/                    # PostgreSQL (Docker)
│   ├── docker-compose.yml
│   ├── schema.sql
│   ├── seed_data.sql
│   └── README.md
├── mcp-ventas-node/       # Ventas Service (Node.js/TypeScript)
│   ├── src/index.ts
│   ├── package.json
│   ├── tsconfig.json
│   ├── .env.example
│   └── README.md
├── mcp-pedidos-py/        # Pedidos Service (Python)
│   ├── src/server.py
│   ├── requirements.txt
│   ├── .env.example
│   └── README.md
├── mcp-gateway/           # Gateway (Node.js/TypeScript)
│   ├── src/index.ts
│   ├── package.json
│   ├── tsconfig.json
│   ├── .env.example
│   └── README.md
├── README.md              # This file
└── TODO.md                # Assignment checklist
```

Each component has its own README with detailed implementation documentation.

## Additional Resources

For more detailed technical information, see individual service documentation:

- [db/README.md](db/README.md) - Database setup and Docker operations
- [mcp-ventas-node/README.md](mcp-ventas-node/README.md) - Node.js service implementation
- [mcp-pedidos-py/README.md](mcp-pedidos-py/README.md) - Python service implementation
- [mcp-gateway/README.md](mcp-gateway/README.md) - Gateway architecture details
