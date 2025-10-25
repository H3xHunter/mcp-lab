# Multi-MCP Gateway System

**Laboratorio: "Multi-MCP con Gateway" (15% de la materia)**

## 📋 Descripción

Sistema de gateway MCP que enruta solicitudes a dos servidores backend especializados:
- **Ventas** (Node.js/TypeScript): Gestión de datos de ventas
- **Pedidos** (Python): Gestión de pedidos

El gateway expone un catálogo unificado de herramientas a Claude Desktop y enruta por prefijo.

## 🏗️ Arquitectura

```
Claude Desktop (stdio)
         ↓
    MCP Gateway
      ↙      ↘
  Ventas    Pedidos
      ↘      ↙
    PostgreSQL
```

**Enrutamiento por prefijo:**
- `ventas_*` → Servidor Ventas (Node.js)
- `pedidos_*` → Servidor Pedidos (Python)

## 🎯 Herramientas Disponibles

**Ventas:**
- `ventas_total_mes_anterior` - Total de ventas del mes anterior
- `ventas_por_dia` - Serie diaria de ventas (últimos N días, default 30)

**Pedidos:**
- `pedidos_estado_por_id` - Consultar estado de pedido por ID
- `pedidos_crear` - Crear nuevo pedido

## 🚀 Quick Start

### 1. Prerequisitos

- Node.js 18+
- Python 3.11+
- Docker & Docker Compose
- Claude Desktop

### 2. Base de Datos

```bash
cd db
docker-compose up -d
docker exec -i mcp-postgres psql -U postgres -d mcp_lab < schema.sql
docker exec -i mcp-postgres psql -U postgres -d mcp_lab < seed_data.sql
```

Ver [db/README.md](db/README.md) para más detalles.

### 3. Servidores Backend

**Ventas (Node.js):**
```bash
cd mcp-ventas-node
npm install
cp .env.example .env  # Editar credenciales DB
npm run build
```

Ver [mcp-ventas-node/README.md](mcp-ventas-node/README.md) para más detalles.

**Pedidos (Python):**
```bash
cd mcp-pedidos-py
python -m venv venv --copies
source venv/bin/activate  # Windows: venv\Scripts\activate
pip install -r requirements.txt
cp .env.example .env  # Editar credenciales DB
```

Ver [mcp-pedidos-py/README.md](mcp-pedidos-py/README.md) para más detalles.

### 4. Gateway

```bash
cd mcp-gateway
npm install
cp .env.example .env  # Configurar rutas a backends
npm run build
```

Ver [mcp-gateway/README.md](mcp-gateway/README.md) para arquitectura detallada.

### 5. Configurar Claude Desktop

Editar configuración de Claude Desktop:
- **macOS**: `~/Library/Application Support/Claude/claude_desktop_config.json`
- **Windows**: `%APPDATA%\Claude\claude_desktop_config.json`
- **Linux**: `~/.config/Claude/claude_desktop_config.json`

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

**⚠️ Importante**: Usar rutas absolutas, no relativas.

### 6. Verificar

1. Reiniciar Claude Desktop completamente
2. Ir a Settings → Developer → Local MCP Servers
3. Verificar que "mcp-gateway" aparece como "connected"
4. Probar herramientas en el chat

## 🧪 Pruebas

Ejemplos de prompts para probar en Claude Desktop:

- "¿Cuál fue el total de ventas del mes anterior?"
- "Muéstrame las ventas de los últimos 7 días"
- "Consulta el estado del pedido 5"
- "Crea un pedido para Juan Pérez por 500000 pesos"

## 📁 Estructura del Proyecto

```
mcp-lab/
├── db/                    # PostgreSQL (Docker)
│   ├── docker-compose.yml
│   ├── schema.sql
│   ├── seed_data.sql
│   └── README.md
├── mcp-ventas-node/       # Servidor Ventas (Node.js/TypeScript)
│   ├── src/index.ts
│   ├── package.json
│   └── README.md
├── mcp-pedidos-py/        # Servidor Pedidos (Python)
│   ├── src/server.py
│   ├── requirements.txt
│   └── README.md
├── mcp-gateway/           # Gateway (Node.js/TypeScript)
│   ├── src/index.ts
│   ├── package.json
│   └── README.md
└── README.md              # Este archivo
```

Cada componente tiene su propio README con documentación detallada.

## 📊 Criterios de Evaluación

- **Funcionamiento (45%)**: Gateway conectado + herramientas visibles + llamadas correctas
- **Diseño/Arquitectura (25%)**: Enrutamiento por prefijo + manejo de errores + logs limpios
- **Código/Calidad (20%)**: README reproducible + organización + comentarios
- **Datos/Testing (10%)**: Scripts SQL consistentes + evidencias
- **Extras (5%)**: Cache, métricas, rate-limiting

## 🐛 Troubleshooting Común

**"Gateway disconnected":**
- Verificar ruta absoluta en claude_desktop_config.json
- Revisar logs del gateway (stderr)
- Confirmar que backends están accesibles

**"Database connection failed":**
- Verificar que PostgreSQL está corriendo: `docker ps`
- Revisar credenciales en archivos .env
- Ver [db/README.md](db/README.md)

**"Module not found":**
- Ejecutar `npm install` o `pip install -r requirements.txt`
- Verificar versiones de Node.js (18+) y Python (3.11+)

**"Backend is not ready":**
- Probar backends individualmente antes del gateway
- Verificar que la base de datos tiene datos (seed_data.sql)
- Revisar logs en stderr de cada componente

**Problemas con venv en Windows:**
- Usar `python -m venv venv --copies` en lugar de `python -m venv venv`
- Ver [mcp-pedidos-py/README.md](mcp-pedidos-py/README.md)

## 📚 Documentación Detallada

- [Base de Datos](db/README.md) - Setup Docker, schema, datos de prueba, comandos
- [Servidor Ventas](mcp-ventas-node/README.md) - Implementación Node.js, herramientas, configuración
- [Servidor Pedidos](mcp-pedidos-py/README.md) - Implementación Python, herramientas, configuración
- [Gateway](mcp-gateway/README.md) - Arquitectura, enrutamiento, integración con Claude

## 🔗 Referencias

- [MCP Documentation](https://modelcontextprotocol.io)
- [MCP SDK](https://github.com/modelcontextprotocol/sdk)
- [Claude Desktop](https://claude.ai/download)

---

**Nota**: Proyecto educativo para laboratorio "Multi-MCP con Gateway" (15% de la materia).
