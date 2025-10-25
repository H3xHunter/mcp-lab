#!/usr/bin/env node

import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
  Tool,
} from "@modelcontextprotocol/sdk/types.js";
import { spawn, ChildProcess } from "child_process";
import dotenv from "dotenv";
import path from "path";
import { fileURLToPath } from "url";

// Load environment variables
dotenv.config();

// ES module __dirname equivalent
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Logging utility - ALL logs go to stderr
const log = {
  debug: (component: string, message: string, ...args: any[]) => {
    if (process.env.LOG_LEVEL === "debug") {
      console.error(
        `[${new Date().toISOString()}] [DEBUG] [${component}] ${message}`,
        ...args
      );
    }
  },
  info: (component: string, message: string, ...args: any[]) => {
    console.error(
      `[${new Date().toISOString()}] [INFO] [${component}] ${message}`,
      ...args
    );
  },
  warn: (component: string, message: string, ...args: any[]) => {
    console.error(
      `[${new Date().toISOString()}] [WARN] [${component}] ${message}`,
      ...args
    );
  },
  error: (component: string, message: string, ...args: any[]) => {
    console.error(
      `[${new Date().toISOString()}] [ERROR] [${component}] ${message}`,
      ...args
    );
  },
};

// Configuration
const CONFIG = {
  ventasServerPath:
    process.env.VENTAS_SERVER_PATH || "../mcp-ventas-node/src/index.ts",
  pedidosServerPath:
    process.env.PEDIDOS_SERVER_PATH || "../mcp-pedidos-py/src/server.py",
  requestTimeout: parseInt(process.env.REQUEST_TIMEOUT || "30000"),
  nodePath: process.env.NODE_PATH || "tsx",
  pythonPath: process.env.PYTHON_PATH || "python",
};

/**
 * Manages connection to a backend MCP server via subprocess
 */
class BackendConnection {
  private process: ChildProcess | null = null;
  private name: string;
  private command: string;
  private args: string[];
  private pendingRequests = new Map<
    number,
    {
      resolve: (value: any) => void;
      reject: (error: Error) => void;
      timeout: NodeJS.Timeout;
    }
  >();
  private nextRequestId = 1;
  private buffer = "";
  private tools: Tool[] = [];
  private isReady = false;

  constructor(name: string, command: string, args: string[]) {
    this.name = name;
    this.command = command;
    this.args = args;
  }

  async start(): Promise<void> {
    log.info("BackendConnection", `Starting ${this.name} backend...`);

    try {
      this.process = spawn(this.command, this.args, {
        stdio: ["pipe", "pipe", "pipe"],
        cwd: path.resolve(__dirname, "../.."),
      });

      if (!this.process.stdout || !this.process.stdin || !this.process.stderr) {
        throw new Error("Failed to get stdio streams");
      }

      // Handle stdout (MCP protocol messages)
      this.process.stdout.on("data", (data: Buffer) => {
        this.handleData(data);
      });

      // Handle stderr (backend logs)
      this.process.stderr.on("data", (data: Buffer) => {
        log.debug(
          this.name,
          `Backend log: ${data.toString().trim()}`
        );
      });

      // Handle process exit
      this.process.on("exit", (code) => {
        log.error(
          "BackendConnection",
          `${this.name} backend exited with code ${code}`
        );
        this.isReady = false;
        // Reject all pending requests
        for (const [id, pending] of this.pendingRequests) {
          clearTimeout(pending.timeout);
          pending.reject(new Error(`Backend ${this.name} crashed`));
          this.pendingRequests.delete(id);
        }
      });

      // Initialize the connection and discover tools
      await this.initialize();

      log.info("BackendConnection", `${this.name} backend started successfully`);
    } catch (error) {
      log.error(
        "BackendConnection",
        `Failed to start ${this.name} backend:`,
        error
      );
      throw error;
    }
  }

  private async initialize(): Promise<void> {
    // Send initialize request
    const initResponse = await this.sendRequest("initialize", {
      protocolVersion: "2024-11-05",
      capabilities: {},
      clientInfo: {
        name: "mcp-gateway",
        version: "1.0.0",
      },
    });

    log.debug(this.name, "Initialize response:", initResponse);

    // Send initialized notification
    await this.sendNotification("notifications/initialized");

    // Discover available tools
    this.tools = await this.discoverTools();
    this.isReady = true;

    log.info(
      "BackendConnection",
      `${this.name} discovered ${this.tools.length} tools`
    );
  }

  private async discoverTools(): Promise<Tool[]> {
    const response = await this.sendRequest("tools/list", {});
    return response.tools || [];
  }

  private handleData(data: Buffer): void {
    this.buffer += data.toString();

    // Process complete JSON-RPC messages
    let newlineIndex;
    while ((newlineIndex = this.buffer.indexOf("\n")) !== -1) {
      const line = this.buffer.slice(0, newlineIndex).trim();
      this.buffer = this.buffer.slice(newlineIndex + 1);

      if (line) {
        try {
          const message = JSON.parse(line);
          this.handleMessage(message);
        } catch (error) {
          log.error(this.name, "Failed to parse message:", line, error);
        }
      }
    }
  }

  private handleMessage(message: any): void {
    log.debug(this.name, "Received message:", message);

    if (message.id && this.pendingRequests.has(message.id)) {
      const pending = this.pendingRequests.get(message.id)!;
      clearTimeout(pending.timeout);
      this.pendingRequests.delete(message.id);

      if (message.error) {
        pending.reject(
          new Error(message.error.message || "Unknown error from backend")
        );
      } else {
        pending.resolve(message.result);
      }
    }
  }

  private sendRequest(method: string, params: any): Promise<any> {
    return new Promise((resolve, reject) => {
      const id = this.nextRequestId++;
      const request = {
        jsonrpc: "2.0",
        id,
        method,
        params,
      };

      const timeout = setTimeout(() => {
        this.pendingRequests.delete(id);
        reject(new Error(`Request timeout for ${method}`));
      }, CONFIG.requestTimeout);

      this.pendingRequests.set(id, { resolve, reject, timeout });

      const message = JSON.stringify(request) + "\n";
      log.debug(this.name, `Sending request:`, request);

      if (this.process?.stdin) {
        this.process.stdin.write(message);
      } else {
        clearTimeout(timeout);
        this.pendingRequests.delete(id);
        reject(new Error("Backend process not available"));
      }
    });
  }

  private sendNotification(method: string, params?: any): Promise<void> {
    return new Promise((resolve, reject) => {
      const notification = {
        jsonrpc: "2.0",
        method,
        ...(params && { params }),
      };

      const message = JSON.stringify(notification) + "\n";
      log.debug(this.name, `Sending notification:`, notification);

      if (this.process?.stdin) {
        this.process.stdin.write(message, (error) => {
          if (error) reject(error);
          else resolve();
        });
      } else {
        reject(new Error("Backend process not available"));
      }
    });
  }

  async callTool(name: string, args: any): Promise<any> {
    if (!this.isReady) {
      throw new Error(`Backend ${this.name} is not ready`);
    }

    const startTime = Date.now();
    try {
      log.info(
        "BackendConnection",
        `Calling tool ${name} on ${this.name} backend`
      );

      const response = await this.sendRequest("tools/call", {
        name,
        arguments: args,
      });

      const duration = Date.now() - startTime;
      log.info(
        "BackendConnection",
        `Tool ${name} completed in ${duration}ms - status: success`
      );

      return response;
    } catch (error) {
      const duration = Date.now() - startTime;
      log.error(
        "BackendConnection",
        `Tool ${name} failed after ${duration}ms:`,
        error
      );
      throw error;
    }
  }

  getTools(): Tool[] {
    return this.tools;
  }

  isBackendReady(): boolean {
    return this.isReady;
  }

  async stop(): Promise<void> {
    log.info("BackendConnection", `Stopping ${this.name} backend...`);

    if (this.process) {
      this.process.kill();
      this.process = null;
    }

    // Clear all pending requests
    for (const [id, pending] of this.pendingRequests) {
      clearTimeout(pending.timeout);
      pending.reject(new Error("Backend stopped"));
      this.pendingRequests.delete(id);
    }
  }
}

/**
 * MCP Gateway - Routes requests to multiple backend servers
 */
class Gateway {
  private ventasBackend: BackendConnection;
  private pedidosBackend: BackendConnection;
  private server: Server;
  private toolMap = new Map<string, BackendConnection>();

  constructor() {
    this.server = new Server(
      {
        name: "mcp-gateway",
        version: "1.0.0",
      },
      {
        capabilities: {
          tools: {},
        },
      }
    );

    // Initialize backend connections
    const ventasPath = path.resolve(__dirname, "..", CONFIG.ventasServerPath);
    const pedidosPath = path.resolve(__dirname, "..", CONFIG.pedidosServerPath);

    this.ventasBackend = new BackendConnection(
      "ventas",
      CONFIG.nodePath,
      [ventasPath]
    );

    this.pedidosBackend = new BackendConnection(
      "pedidos",
      CONFIG.pythonPath,
      [pedidosPath]
    );

    this.setupHandlers();
  }

  private setupHandlers(): void {
    // Handle tool list requests
    this.server.setRequestHandler(ListToolsRequestSchema, async () => {
      log.info("Gateway", "Listing all available tools");

      const allTools: Tool[] = [];

      // Get tools from ventas backend
      if (this.ventasBackend.isBackendReady()) {
        allTools.push(...this.ventasBackend.getTools());
      }

      // Get tools from pedidos backend
      if (this.pedidosBackend.isBackendReady()) {
        allTools.push(...this.pedidosBackend.getTools());
      }

      log.info("Gateway", `Returning ${allTools.length} total tools`);
      return { tools: allTools };
    });

    // Handle tool call requests
    this.server.setRequestHandler(CallToolRequestSchema, async (request) => {
      const { name, arguments: args } = request.params;

      log.info("Gateway", `Received tool call request for: ${name}`);

      try {
        // Route based on tool name prefix
        const backend = this.routeToolCall(name);

        if (!backend) {
          throw new Error(`Unknown tool: ${name}`);
        }

        if (!backend.isBackendReady()) {
          throw new Error(`Backend for ${name} is not ready`);
        }

        // Forward the request to the appropriate backend
        const response = await backend.callTool(name, args);

        return response;
      } catch (error) {
        const errorMessage =
          error instanceof Error ? error.message : "Unknown error";
        log.error("Gateway", `Tool call failed for ${name}:`, errorMessage);

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
  }

  private routeToolCall(toolName: string): BackendConnection | null {
    // Prefix-based routing
    if (toolName.startsWith("ventas_")) {
      log.debug("Gateway", `Routing ${toolName} to ventas backend`);
      return this.ventasBackend;
    } else if (toolName.startsWith("pedidos_")) {
      log.debug("Gateway", `Routing ${toolName} to pedidos backend`);
      return this.pedidosBackend;
    }

    log.warn("Gateway", `No backend found for tool: ${toolName}`);
    return null;
  }

  async start(): Promise<void> {
    log.info("Gateway", "Starting MCP Gateway...");

    try {
      // Start backend connections
      await Promise.all([
        this.ventasBackend.start(),
        this.pedidosBackend.start(),
      ]);

      log.info("Gateway", "All backends started successfully");

      // Build tool mapping
      this.buildToolMap();

      // Start stdio server for Claude Desktop
      const transport = new StdioServerTransport();
      await this.server.connect(transport);

      log.info("Gateway", "MCP Gateway started successfully");
    } catch (error) {
      log.error("Gateway", "Failed to start gateway:", error);
      throw error;
    }
  }

  private buildToolMap(): void {
    this.toolMap.clear();

    // Map ventas tools
    for (const tool of this.ventasBackend.getTools()) {
      this.toolMap.set(tool.name, this.ventasBackend);
    }

    // Map pedidos tools
    for (const tool of this.pedidosBackend.getTools()) {
      this.toolMap.set(tool.name, this.pedidosBackend);
    }

    log.info("Gateway", `Tool map built with ${this.toolMap.size} tools`);
  }

  async stop(): Promise<void> {
    log.info("Gateway", "Stopping MCP Gateway...");

    await Promise.all([
      this.ventasBackend.stop(),
      this.pedidosBackend.stop(),
    ]);

    log.info("Gateway", "MCP Gateway stopped");
  }
}

// Main entry point
async function main() {
  const gateway = new Gateway();

  // Handle graceful shutdown
  process.on("SIGINT", async () => {
    log.info("main", "Received SIGINT, shutting down...");
    await gateway.stop();
    process.exit(0);
  });

  process.on("SIGTERM", async () => {
    log.info("main", "Received SIGTERM, shutting down...");
    await gateway.stop();
    process.exit(0);
  });

  try {
    await gateway.start();
  } catch (error) {
    log.error("main", "Fatal error:", error);
    process.exit(1);
  }
}

main().catch((error) => {
  log.error("main", "Unhandled error:", error);
  process.exit(1);
});
