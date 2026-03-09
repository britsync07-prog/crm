const { createServer } = require("http");
const { parse } = require("url");
const next = require("next");
const { Server } = require("socket.io");
const { PrismaClient } = require("@prisma/client");
const { PrismaBetterSqlite3 } = require("@prisma/adapter-better-sqlite3");
const { spawn } = require("child_process");
const path = require("path");
const fs = require("fs");

const dev = process.env.NODE_ENV !== "production";

// ── Auto-start LiveKit server ──────────────────────────────────────────────
(function startLiveKit() {
    // Look for livekit folder relative to where server.js is running from (process.cwd())
    const livekitDir = path.join(process.cwd(), "livekit");
    const livekitBinary = path.join(livekitDir, "livekit-server");

    if (!fs.existsSync(livekitBinary)) {
        console.warn("[LiveKit] Binary not found at", livekitBinary, "— skipping auto-start.");
        return;
    }

    const args = ["--dev"];                          // --dev uses devkey/secret automatically
    const config = path.join(livekitDir, "config.yaml");
    if (fs.existsSync(config)) args.push("--config", config);

    const lk = spawn(livekitBinary, args, {
        stdio: ["ignore", "pipe", "pipe"],
        detached: false,
    });

    lk.stdout.on("data", d => process.stdout.write(`[LiveKit] ${d}`));
    lk.stderr.on("data", d => process.stderr.write(`[LiveKit] ${d}`));
    lk.on("error", err => console.error("[LiveKit] Failed to start:", err.message));
    lk.on("close", code => {
        if (code !== 0) console.warn(`[LiveKit] Exited with code ${code}`);
    });

    // Kill LiveKit when Node exits
    process.on("exit", () => lk.kill());
    process.on("SIGINT", () => { lk.kill(); process.exit(); });
    process.on("SIGTERM", () => { lk.kill(); process.exit(); });

    console.log("[LiveKit] Starting LiveKit server (--dev mode)…");
})();
// ──────────────────────────────────────────────────────────────────────────

const hostname = "localhost";
const port = process.env.PORT || 3001;

const app = next({ dev, hostname, port });
const handle = app.getRequestHandler();

const adapter = new PrismaBetterSqlite3({ url: process.env.DATABASE_URL || "file:prisma/dev.db" });
const prisma = new PrismaClient({ adapter });

// Track online users per workspace: { workspaceId: Set<{ socketId, userId, name }> }
const onlineUsers = new Map();

app.prepare().then(() => {
    const httpServer = createServer(async (req, res) => {
        try {
            const parsedUrl = parse(req.url, true);
            await handle(req, res, parsedUrl);
        } catch (err) {
            console.error("Error occurred handling", req.url, err);
            res.statusCode = 500;
            res.end("internal server error");
        }
    });

    const io = new Server(httpServer, {
        cors: {
            origin: "*",
            methods: ["GET", "POST"],
        },
    });

    io.on("connection", (socket) => {
        console.log("[Socket.IO] Client connected:", socket.id);

        // --- Join a workspace room ---
        socket.on("join-workspace", async ({ workspaceId, userId, userName }) => {
            socket.join(`workspace:${workspaceId}`);

            if (!onlineUsers.has(workspaceId)) {
                onlineUsers.set(workspaceId, new Map());
            }
            onlineUsers.get(workspaceId).set(socket.id, { userId, name: userName });

            // Broadcast updated presence list to entire workspace room
            const presence = Array.from(onlineUsers.get(workspaceId).values());
            io.to(`workspace:${workspaceId}`).emit("presence:update", presence);

            console.log(`[Socket.IO] User ${userName} joined workspace ${workspaceId}`);
        });

        // --- Leave a workspace room explicitly ---
        socket.on("leave-workspace", ({ workspaceId }) => {
            socket.leave(`workspace:${workspaceId}`);
            if (onlineUsers.has(workspaceId)) {
                onlineUsers.get(workspaceId).delete(socket.id);
                const presence = Array.from(onlineUsers.get(workspaceId).values());
                io.to(`workspace:${workspaceId}`).emit("presence:update", presence);
            }
        });

        // --- Join/Leave a specific channel ---
        socket.on("join-channel", ({ channelId }) => {
            socket.join(`channel:${channelId}`);
        });

        socket.on("leave-channel", ({ channelId }) => {
            socket.leave(`channel:${channelId}`);
        });

        // --- Real-time chat message ---
        socket.on("chat:message", async ({ workspaceId, channelId, userId, content }) => {
            if (!channelId || !userId || !content?.trim()) return;

            try {
                // Persist the message
                const saved = await prisma.workspaceMessage.create({
                    data: { channelId, userId, content: content.trim() },
                    include: {
                        user: { select: { id: true, name: true, email: true, image: true } },
                    },
                });

                // Broadcast to all in the channel room 
                io.to(`channel:${channelId}`).emit("chat:message", {
                    id: saved.id,
                    channelId: saved.channelId,
                    content: saved.content,
                    createdAt: saved.createdAt,
                    user: saved.user,
                });
            } catch (err) {
                console.error("[Socket.IO] Error saving message:", err);
                socket.emit("chat:error", { message: "Failed to send message." });
            }
        });

        // --- Typing indicator ---
        socket.on("chat:typing", ({ channelId, userName, isTyping }) => {
            socket.to(`channel:${channelId}`).emit("chat:typing", { userName, isTyping });
        });

        // --- Task update notification ---
        socket.on("task:updated", ({ workspaceId, task }) => {
            socket.to(`workspace:${workspaceId}`).emit("task:updated", task);
        });

        // --- Handle disconnect ---
        socket.on("disconnect", () => {
            // Remove from all workspace rooms
            for (const [workspaceId, users] of onlineUsers.entries()) {
                if (users.has(socket.id)) {
                    users.delete(socket.id);
                    const presence = Array.from(users.values());
                    io.to(`workspace:${workspaceId}`).emit("presence:update", presence);
                }
            }
            console.log("[Socket.IO] Client disconnected:", socket.id);
        });
    });

    httpServer
        .once("error", (err) => {
            console.error(err);
            process.exit(1);
        })
        .listen(port, () => {
            console.log(`> Ready on http://${hostname}:${port}`);
            console.log(`> Socket.IO server running`);
        });
});
