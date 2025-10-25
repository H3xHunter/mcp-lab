# MCP Gateway

A TypeScript-based Model Context Protocol (MCP) gateway that routes requests to multiple backend MCP servers using prefix-based routing.

## Architecture

The MCP Gateway acts as a single entry point for Claude Desktop, providing unified access to multiple specialized MCP servers:

```
┌─────────────────┐
│ Claude Desktop  │
└────────┬────────┘
         │ stdio
         ▼
┌─────────────────────────────────────┐
│         MCP Gateway                 │
│  ┌───────────────────────────────┐  │
│  │   Prefix-based Router         │  │
│  │  ventas_*  → ventas backend   │  │
│  │  pedidos_* → pedidos backend  │  │
│  └───────────────────────────────┘  │
└──────────┬──────────┬───────────────┘
           │          │
    stdio  │          │ stdio
           ▼          ▼
  ┌────────────┐  ┌─────────────┐
  │  ventas    │  │  pedidos    │
  │  (Node.js) │  │  (Python)   │
  └─────┬──────┘  └──────┬──────┘
        │                │
        └────────┬───────┘
                 │
                 ▼
        ┌─────────────────┐
        │   PostgreSQL    │
        └─────────────────┘
```

## How It Works

### Prefix-based Routing

- **ventas_*** → mcp-ventas-node
  - ventas_total_mes_anterior
  - ventas_por_dia
  
- **pedidos_*** → mcp-pedidos-py
  - pedidos_estado_por_id
  - pedidos_crear

### Connection Method

Subprocess communication via stdio with JSON-RPC protocol.

## Setup

1. Install dependencies:
```bash
cd mcp-gateway
npm install
```

2. Configure:
```bash
cp .env.example .env
```

3. Build:
```bash
npm run build
```

4. Run:
```bash
npm start
```

## Claude Desktop Configuration

```json
{
  "mcpServers": {
    "gateway": {
      "command": "node",
      "args": ["C:/path/to/mcp-gateway/dist/index.js"]
    }
  }
}
```

## Testing

Test with MCP Inspector:
```bash
npx @modelcontextprotocol/inspector npm run dev
```

