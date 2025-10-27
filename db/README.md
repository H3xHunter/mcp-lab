# Database (PostgreSQL)

For complete documentation, see the [main README](../README.md#database-postgresql).

## Quick Start

```bash
cd db
docker-compose up -d
docker exec -i mcp-postgres psql -U postgres -d mcp_lab < schema.sql
docker exec -i mcp-postgres psql -U postgres -d mcp_lab < seed_data.sql
```

## Connection Details

- **Port:** 5432
- **Database:** mcp_lab
- **User:** postgres
- **Password:** postgres

## Common Commands

**Start database:**
```bash
docker-compose up -d
```

**Stop database:**
```bash
docker-compose down
```

**Access psql:**
```bash
docker exec -it mcp-postgres psql -U postgres -d mcp_lab
```

---

See main README for:
- [Complete database schema](../README.md#schema)
- [Sample data details](../README.md#sample-data)
- [Database management commands](../README.md#database-management)
- [Troubleshooting](../README.md#database-troubleshooting)
- [Backup and restore procedures](../README.md#maintenance)
