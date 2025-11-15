import type { Express } from "express";
import { createServer, type Server } from "http";
import { WebSocketServer, WebSocket } from "ws";
import { setupApiRoutes } from "./api/routes";
import { healthCheckWorker } from "./workers/health-check";
import { statusAggregatorWorker } from "./workers/status-aggregator";
import { log } from "./vite";

export async function registerRoutes(app: Express): Promise<Server> {
  // Setup HTTP server
  const httpServer = createServer(app);

  // Setup API routes
  setupApiRoutes(app);

  // Setup WebSocket server for real-time updates
  const wss = new WebSocketServer({ server: httpServer, path: "/ws" });

  wss.on("connection", (ws: WebSocket) => {
    log("WebSocket client connected");

    ws.on("message", (message: string) => {
      try {
        const data = JSON.parse(message.toString());

        // Handle different message types
        if (data.type === "subscribe") {
          // Subscribe to workspace updates
          (ws as any).workspaceId = data.workspaceId;
          ws.send(JSON.stringify({ type: "subscribed", workspaceId: data.workspaceId }));
        }
      } catch (error) {
        console.error("WebSocket message error:", error);
      }
    });

    ws.on("close", () => {
      log("WebSocket client disconnected");
    });

    ws.on("error", (error) => {
      console.error("WebSocket error:", error);
    });
  });

  // Function to broadcast updates to all connected clients
  (global as any).broadcastUpdate = (workspaceId: string, event: string, data: any) => {
    wss.clients.forEach((client) => {
      if (client.readyState === WebSocket.OPEN && (client as any).workspaceId === workspaceId) {
        client.send(JSON.stringify({ type: event, data }));
      }
    });
  };

  // Start background workers
  if (process.env.NODE_ENV !== "test") {
    log("Starting background workers...");
    healthCheckWorker.start().catch(console.error);
    statusAggregatorWorker.start().catch(console.error);
  }

  return httpServer;
}
