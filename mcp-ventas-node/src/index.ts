#!/usr/bin/env node

import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
} from "@modelcontextprotocol/sdk/types.js";
import pkg from "pg";
const { Pool } = pkg;
import dotenv from "dotenv";

// Load environment variables
dotenv.config();

// Database configuration
const pool = new Pool({
  host: process.env.DB_HOST || "localhost",
  port: parseInt(process.env.DB_PORT || "5432"),
  database: process.env.DB_NAME || "mcp_lab",
  user: process.env.DB_USER || "postgres",
  password: process.env.DB_PASSWORD || "postgres",
});

// Logging to stderr
const log = (message: string) => {
  console.error(`[mcp-ventas-node] ${message}`);
};

// Tool implementations
async function ventasTotalMesAnterior(): Promise<{
  mes: string;
  total: number;
}> {
  const client = await pool.connect();
  try {
    // Calculate first day of last month and first day of this month
    const now = new Date();
    const firstDayThisMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const firstDayLastMonth = new Date(
      now.getFullYear(),
      now.getMonth() - 1,
      1
    );

    const query = `
      SELECT SUM(monto) as total
      FROM ventas
      WHERE fecha >= $1 AND fecha < $2
    `;

    const result = await client.query(query, [
      firstDayLastMonth,
      firstDayThisMonth,
    ]);

    const total = parseFloat(result.rows[0]?.total || "0");
    const mes = firstDayLastMonth.toISOString().slice(0, 7); // YYYY-MM format

    log(`Total ventas mes anterior (${mes}): ${total}`);

    return { mes, total };
  } finally {
    client.release();
  }
}

async function ventasPorDia(n: number = 30): Promise<
  Array<{
    fecha: string;
    total: number;
  }>
> {
  // Validate input
  if (n < 1 || n > 365) {
    throw new Error("N debe estar entre 1 y 365");
  }

  const client = await pool.connect();
  try {
    const query = `
      SELECT
        fecha::date as fecha,
        SUM(monto) as total
      FROM ventas
      WHERE fecha >= NOW() - INTERVAL '${n} days'
      GROUP BY fecha::date
      ORDER BY fecha
    `;

    const result = await client.query(query);

    const ventas = result.rows.map((row) => ({
      fecha: new Date(row.fecha).toISOString().slice(0, 10), // YYYY-MM-DD
      total: parseFloat(row.total),
    }));

    log(`Ventas por día (últimos ${n} días): ${ventas.length} registros`);

    return ventas;
  } finally {
    client.release();
  }
}

// Create MCP server
const server = new Server(
  {
    name: "mcp-ventas-node",
    version: "1.0.0",
  },
  {
    capabilities: {
      tools: {},
    },
  }
);

// List available tools
server.setRequestHandler(ListToolsRequestSchema, async () => {
  return {
    tools: [
      {
        name: "ventas_total_mes_anterior",
        description:
          "Calcula el total de ventas del mes anterior. No requiere parámetros, usa la fecha actual automáticamente.",
        inputSchema: {
          type: "object",
          properties: {},
          required: [],
        },
      },
      {
        name: "ventas_por_dia",
        description:
          "Obtiene la serie de ventas diarias para los últimos N días. Retorna un array con la fecha y total de ventas por día.",
        inputSchema: {
          type: "object",
          properties: {
            n: {
              type: "number",
              description:
                "Número de días hacia atrás (por defecto 30, máximo 365)",
              default: 30,
              minimum: 1,
              maximum: 365,
            },
          },
          required: [],
        },
      },
    ],
  };
});

// Handle tool calls
server.setRequestHandler(CallToolRequestSchema, async (request) => {
  const { name, arguments: args } = request.params;

  try {
    if (name === "ventas_total_mes_anterior") {
      const result = await ventasTotalMesAnterior();
      return {
        content: [
          {
            type: "text",
            text: JSON.stringify(result, null, 2),
          },
        ],
      };
    } else if (name === "ventas_por_dia") {
      const n = (args as { n?: number })?.n || 30;
      const result = await ventasPorDia(n);
      return {
        content: [
          {
            type: "text",
            text: JSON.stringify(result, null, 2),
          },
        ],
      };
    } else {
      throw new Error(`Herramienta desconocida: ${name}`);
    }
  } catch (error) {
    const errorMessage =
      error instanceof Error ? error.message : "Error desconocido";
    log(`Error ejecutando ${name}: ${errorMessage}`);
    return {
      content: [
        {
          type: "text",
          text: JSON.stringify({ error: errorMessage }),
        },
      ],
      isError: true,
    };
  }
});

// Start server
async function main() {
  log("Iniciando servidor MCP de ventas...");

  // Test database connection
  try {
    const client = await pool.connect();
    log("Conexión a base de datos exitosa");
    client.release();
  } catch (error) {
    log(
      `Error conectando a base de datos: ${error instanceof Error ? error.message : "Error desconocido"}`
    );
    process.exit(1);
  }

  const transport = new StdioServerTransport();
  await server.connect(transport);

  log("Servidor MCP de ventas iniciado correctamente");

  // Handle graceful shutdown
  process.on("SIGINT", async () => {
    log("Cerrando servidor...");
    await pool.end();
    process.exit(0);
  });

  process.on("SIGTERM", async () => {
    log("Cerrando servidor...");
    await pool.end();
    process.exit(0);
  });
}

main().catch((error) => {
  log(`Error fatal: ${error instanceof Error ? error.message : "Error desconocido"}`);
  process.exit(1);
});
