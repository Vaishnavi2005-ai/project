import express from "express";
import { createServer } from "http";
import { WebSocketServer, WebSocket } from "ws";
import { createServer as createViteServer } from "vite";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function startServer() {
  const app = express();
  const server = createServer(app);
  const wss = new WebSocketServer({ server });

  const PORT = 3000;

  // Track active users: Map<WebSocket, { id: string, name: string, avatar: string }>
  const activeUsers = new Map<WebSocket, any>();

  wss.on("connection", (ws) => {
    console.log("New client connected");

    ws.on("message", (message) => {
      try {
        const data = JSON.parse(message.toString());

        if (data.type === "USER_JOINED") {
          activeUsers.set(ws, data.user);
          broadcastPresence();
        }
      } catch (err) {
        console.error("Error parsing message:", err);
      }
    });

    ws.on("close", () => {
      activeUsers.delete(ws);
      broadcastPresence();
    });

    function broadcastPresence() {
      const usersMap = new Map();
      activeUsers.forEach((user) => {
        usersMap.set(user.id, user);
      });
      const users = Array.from(usersMap.values());
      const payload = JSON.stringify({ type: "PRESENCE_UPDATE", users });
      wss.clients.forEach((client) => {
        if (client.readyState === WebSocket.OPEN) {
          client.send(payload);
        }
      });
    }
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    app.use(express.static(path.join(__dirname, "dist")));
    app.get("*", (req, res) => {
      res.sendFile(path.join(__dirname, "dist", "index.html"));
    });
  }

  server.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
