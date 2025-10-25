# MCP Lab Database Setup

This directory contains the PostgreSQL database infrastructure for the MCP Lab project.

## Overview

The database consists of two main tables:
- **ventas** (sales): Sales transactions with date, amount, and description
- **pedidos** (orders): Customer orders with status tracking

## Prerequisites

- Docker Desktop installed and running
- Docker Compose (included with Docker Desktop)
- At least 500MB of free disk space

## Quick Start

### 1. Start the Database

```bash
cd db
docker-compose up -d
```

This will:
- Pull the PostgreSQL 15 Alpine image (if not already downloaded)
- Create a container named `mcp-postgres`
- Expose PostgreSQL on port 5432
- Create a persistent volume for data storage

### 2. Wait for Database to be Ready

Check the health status:
```bash
docker-compose ps
```

Wait until the status shows "healthy" (usually 5-10 seconds).

### 3. Initialize the Schema

```bash
docker exec -i mcp-postgres psql -U postgres -d mcp_lab < schema.sql
```

Expected output:
```
DROP TABLE
DROP TABLE
CREATE TABLE
CREATE TABLE
CREATE INDEX
CREATE INDEX
CREATE INDEX
COMMENT
...
```

### 4. Load Sample Data

```bash
docker exec -i mcp-postgres psql -U postgres -d mcp_lab < seed_data.sql
```

This will populate the database with:
- 450-900+ sales transactions (90 days of data)
- 44 customer orders with various statuses

## Docker Commands

### Basic Operations

**Start the database:**
```bash
docker-compose up -d
```

**Stop the database:**
```bash
docker-compose down
```

**View logs:**
```bash
docker-compose logs -f postgres
```

**Check status:**
```bash
docker-compose ps
```

### Data Management

**Reset database (removes all data and volumes):**
```bash
docker-compose down -v
```
⚠️ **Warning:** This will permanently delete all data!

**Backup database:**
```bash
docker exec mcp-postgres pg_dump -U postgres mcp_lab > backup_$(date +%Y%m%d_%H%M%S).sql
```

**Restore from backup:**
```bash
docker exec -i mcp-postgres psql -U postgres -d mcp_lab < backup_file.sql
```

## Database Access

### Connection Details

- **Host:** localhost
- **Port:** 5432
- **Database:** mcp_lab
- **User:** postgres
- **Password:** postgres

### Connection String Format

```
postgresql://postgres:postgres@localhost:5432/mcp_lab
```

### Using psql (Interactive Shell)

```bash
docker exec -it mcp-postgres psql -U postgres -d mcp_lab
```

Common psql commands:
```sql
\dt              -- List all tables
\d ventas        -- Describe ventas table
\d pedidos       -- Describe pedidos table
\q               -- Quit psql
```

### Sample Queries

**Check sales data:**
```sql
SELECT COUNT(*) FROM ventas;
SELECT fecha, SUM(monto) as total FROM ventas GROUP BY fecha ORDER BY fecha DESC LIMIT 10;
```

**Check orders data:**
```sql
SELECT COUNT(*) FROM pedidos;
SELECT estado, COUNT(*) as cantidad FROM pedidos GROUP BY estado;
```

## Troubleshooting

### Port Already in Use

**Problem:** Error binding to port 5432

**Solutions:**

1. **Check if PostgreSQL is already running locally:**
   ```bash
   # Windows
   netstat -ano | findstr :5432

   # Linux/macOS
   lsof -i :5432
   ```

2. **Stop local PostgreSQL service:**
   ```bash
   # Windows (run as Administrator)
   net stop postgresql-x64-15

   # Linux
   sudo systemctl stop postgresql

   # macOS
   brew services stop postgresql
   ```

3. **Or change the port in docker-compose.yml:**
   ```yaml
   ports:
     - "5433:5432"  # Use port 5433 instead
   ```

### Permission Denied

**Problem:** Permission denied when running docker commands

**Solutions:**

1. **Windows:** Run Command Prompt or PowerShell as Administrator

2. **Linux/macOS:** Add your user to the docker group:
   ```bash
   sudo usermod -aG docker $USER
   # Log out and back in for changes to take effect
   ```

3. **Or use sudo:**
   ```bash
   sudo docker-compose up -d
   ```

### Connection Refused

**Problem:** Can't connect to database

**Solutions:**

1. **Check container is running:**
   ```bash
   docker-compose ps
   ```

2. **Check health status:**
   ```bash
   docker inspect mcp-postgres --format='{{.State.Health.Status}}'
   ```

3. **View logs for errors:**
   ```bash
   docker-compose logs postgres
   ```

4. **Restart the container:**
   ```bash
   docker-compose restart
   ```

5. **Check Docker Desktop is running** (Windows/macOS)

### Database Already Exists Error

**Problem:** Error when running schema.sql because database already has tables

**Solution:** The schema.sql includes `DROP TABLE IF EXISTS` statements, so this shouldn't happen. If it does:

```bash
# Reset and recreate
docker-compose down -v
docker-compose up -d
# Wait for healthy status
docker exec -i mcp-postgres psql -U postgres -d mcp_lab < schema.sql
docker exec -i mcp-postgres psql -U postgres -d mcp_lab < seed_data.sql
```

### Schema File Not Found

**Problem:** No such file or directory: schema.sql

**Solution:** Make sure you're running commands from the `db/` directory:

```bash
cd db
docker exec -i mcp-postgres psql -U postgres -d mcp_lab < schema.sql
```

**Or use absolute paths:**
```bash
docker exec -i mcp-postgres psql -U postgres -d mcp_lab < /full/path/to/db/schema.sql
```

### Docker Daemon Not Running

**Problem:** Cannot connect to Docker daemon

**Solutions:**

1. **Windows/macOS:** Start Docker Desktop application

2. **Linux:** Start Docker service:
   ```bash
   sudo systemctl start docker
   ```

## Advanced Configuration

### Changing Database Password

1. Edit `docker-compose.yml`:
   ```yaml
   environment:
     POSTGRES_PASSWORD: your_secure_password
   ```

2. Recreate the container:
   ```bash
   docker-compose down -v
   docker-compose up -d
   ```

3. Update `.env` files in both MCP servers with the new password

### Using a Custom Network

The docker-compose.yml already includes a custom network (`mcp_network`). To connect other services:

```yaml
# In another docker-compose.yml
networks:
  default:
    external:
      name: db_mcp_network
```

### Performance Tuning

For production or heavy testing, you can add PostgreSQL configuration:

```yaml
# Add to docker-compose.yml under postgres service
command:
  - "postgres"
  - "-c"
  - "max_connections=200"
  - "-c"
  - "shared_buffers=256MB"
```

## Data Summary

### Ventas (Sales) Table
- **Records:** ~450-900 transactions
- **Date Range:** Last 90 days
- **Amount Range:** 50,000 - 9,100,000 COP
- **Transactions per Day:** 3-10 (randomly generated)

### Pedidos (Orders) Table
- **Records:** 44 orders
- **Status Distribution:**
  - Completado: 17 (40%)
  - Pendiente: 12 (30%)
  - Procesando: 8 (20%)
  - Cancelado: 4 (10%)
- **Date Range:** Last 60 days
- **Amount Range:** 155,000 - 18,200,000 COP

## Database Schema

### ventas
```sql
id          SERIAL PRIMARY KEY
fecha       DATE NOT NULL
monto       DECIMAL(10,2) NOT NULL CHECK (monto >= 0)
descripcion VARCHAR(255)
created_at  TIMESTAMP DEFAULT CURRENT_TIMESTAMP
```

### pedidos
```sql
id      SERIAL PRIMARY KEY
cliente VARCHAR(255) NOT NULL
monto   DECIMAL(10,2) NOT NULL CHECK (monto >= 0)
estado  VARCHAR(50) NOT NULL DEFAULT 'pendiente'
fecha   TIMESTAMP DEFAULT CURRENT_TIMESTAMP
```

**Estado constraint:** Must be one of: 'pendiente', 'procesando', 'completado', 'cancelado'

## Integration with MCP Servers

After setting up the database, configure both MCP servers:

### mcp-ventas-node
```bash
cd ../mcp-ventas-node
cp .env.example .env
# Edit .env with DB connection details
```

### mcp-pedidos-py
```bash
cd ../mcp-pedidos-py
cp .env.example .env
# Edit .env with DB connection details
```

## Maintenance

### Regular Cleanup

Remove old containers and images:
```bash
docker system prune -a
```

### Monitoring Disk Usage

```bash
docker system df
```

### View Container Resource Usage

```bash
docker stats mcp-postgres
```

## Support

For issues with:
- **Docker:** Check Docker Desktop documentation
- **PostgreSQL:** Check PostgreSQL 15 documentation
- **MCP Servers:** See respective README.md in mcp-ventas-node and mcp-pedidos-py

## License

MIT
