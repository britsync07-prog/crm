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

    // Bind to 0.0.0.0 so external clients can hit the WebSocket on the VPS
    const args = ["--bind", "0.0.0.0"];
    
    // Only use --dev in non-production environments
    if (dev) {
        args.push("--dev");
    } else {
        // In production, use the keys from .env
        const apiKey = process.env.LIVEKIT_API_KEY;
        const apiSecret = process.env.LIVEKIT_API_SECRET;
        if (apiKey && apiSecret) {
            args.push("--keys", `${apiKey}: ${apiSecret}`);
        }
    }

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

    console.log(`[LiveKit] Starting LiveKit server (${dev ? "Development" : "Production"} mode)…`);
})();
// ──────────────────────────────────────────────────────────────────────────

const hostname = "localhost";
const port = process.env.PORT || 3001;
const reminderIntervalMs = Math.max(30, Number(process.env.REMINDER_WORKER_SECONDS || 60)) * 1000;
const autoReminderEnabled = process.env.AUTO_REMINDER_WORKER !== "false";
const outreachReplyIntervalMs = Math.max(60, Number(process.env.OUTREACH_REPLY_WORKER_SECONDS || 180)) * 1000;
const autoOutreachReplyEnabled = process.env.AUTO_OUTREACH_REPLY_WORKER !== "false";
const internalRequestHeaders = process.env.INTERNAL_CRON_SECRET
    ? { "x-internal-cron-secret": process.env.INTERNAL_CRON_SECRET }
    : process.env.GLOBAL_API_KEY
        ? { "x-api-key": process.env.GLOBAL_API_KEY }
        : {};
const allowedSocketOrigins = (process.env.SOCKET_ALLOWED_ORIGINS || process.env.NEXT_PUBLIC_APP_URL || process.env.NEXT_PUBLIC_API_URL || `http://localhost:${port}`)
    .split(",")
    .map(origin => origin.trim())
    .filter(Boolean);

function parseCookieHeader(cookieHeader) {
    return String(cookieHeader || "")
        .split(";")
        .map(part => part.trim())
        .filter(Boolean)
        .reduce((cookies, part) => {
            const eq = part.indexOf("=");
            if (eq === -1) return cookies;
            cookies[decodeURIComponent(part.slice(0, eq))] = decodeURIComponent(part.slice(eq + 1));
            return cookies;
        }, {});
}

async function verifySocketSession(socket) {
    const sessionToken = parseCookieHeader(socket.handshake.headers.cookie).session;
    if (!sessionToken || !process.env.JWT_SECRET) return null;

    try {
        const { jwtVerify } = await import("jose");
        const key = new TextEncoder().encode(process.env.JWT_SECRET);
        const { payload } = await jwtVerify(sessionToken, key, { algorithms: ["HS256"] });
        if (!payload?.id || !payload?.email) return null;
        return payload;
    } catch {
        return null;
    }
}

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
            origin: allowedSocketOrigins,
            methods: ["GET", "POST"],
        },
    });

    io.on("connection", async (socket) => {
        const session = await verifySocketSession(socket);
        if (!session) {
            socket.emit("auth:error", { message: "Authentication required." });
            socket.disconnect(true);
            return;
        }

        socket.data.session = session;
        console.log("[Socket.IO] Client connected:", socket.id);

        // --- Join a workspace room ---
        socket.on("join-workspace", async ({ workspaceId, userName }) => {
            const userId = socket.data.session.id;
            if (!workspaceId || !userId) {
                socket.emit("presence:error", { message: "Workspace and user are required." });
                return;
            }

            const workspace = await prisma.workspace.findUnique({
                where: { id: workspaceId },
                select: {
                    ownerId: true,
                    users: { where: { userId }, select: { id: true } },
                },
            });

            if (!workspace || (workspace.ownerId !== userId && workspace.users.length === 0)) {
                socket.emit("presence:error", { message: "Not authorized for this workspace." });
                return;
            }

            socket.join(`workspace:${workspaceId}`);

            if (!onlineUsers.has(workspaceId)) {
                onlineUsers.set(workspaceId, new Map());
            }
            onlineUsers.get(workspaceId).set(socket.id, { userId, name: userName || socket.data.session.email });

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
        socket.on("join-channel", async ({ channelId }) => {
            const userId = socket.data.session.id;
            if (!channelId || !userId) return;

            try {
                const channel = await prisma.channel.findUnique({
                    where: { id: channelId },
                    select: {
                        isPrivate: true,
                        workspaceId: true,
                        allowedRoles: { select: { id: true } },
                        workspace: {
                            select: {
                                ownerId: true,
                                users: { where: { userId }, select: { id: true, role: true } },
                            },
                        },
                    },
                });

                if (!channel) {
                    socket.emit("chat:error", { message: "Channel not found." });
                    return;
                }

                const membership = channel.workspace.users[0];
                const isOwner = channel.workspace.ownerId === userId;
                const isAdmin = isOwner || membership?.role === "ADMIN";

                if (!isOwner && !membership) {
                    socket.emit("chat:error", { message: "Not authorized for this channel." });
                    return;
                }

                if (channel.isPrivate && !isAdmin) {
                    const userRoles = await prisma.workspaceUserRole.findMany({
                        where: { userId, role: { workspaceId: channel.workspaceId } },
                        select: { roleId: true },
                    });
                    const userRoleIds = new Set(userRoles.map((role) => role.roleId));
                    const hasAllowedRole = channel.allowedRoles.some((role) => userRoleIds.has(role.id));

                    if (!hasAllowedRole) {
                        socket.emit("chat:error", { message: "Not authorized for this channel." });
                        return;
                    }
                }

                socket.join(`channel:${channelId}`);
            } catch (err) {
                console.error("[Socket.IO] Error joining channel:", err);
                socket.emit("chat:error", { message: "Failed to join channel." });
            }
        });

        socket.on("leave-channel", ({ channelId }) => {
            socket.leave(`channel:${channelId}`);
        });

        // --- Real-time chat message ---
        socket.on("chat:message", async ({ workspaceId, channelId, content }) => {
            const userId = socket.data.session.id;
            if (!channelId || !userId || !content?.trim()) return;

            try {
                const channel = await prisma.channel.findUnique({
                    where: { id: channelId },
                    select: {
                        workspaceId: true,
                        isPrivate: true,
                        allowedRoles: { select: { id: true } },
                        workspace: {
                            select: {
                                ownerId: true,
                                users: { where: { userId }, select: { id: true, role: true } },
                            },
                        },
                    },
                });

                if (!channel || channel.workspaceId !== workspaceId) {
                    socket.emit("chat:error", { message: "Channel not found." });
                    return;
                }

                const membership = channel.workspace.users[0];
                const isOwner = channel.workspace.ownerId === userId;
                const isAdmin = isOwner || membership?.role === "ADMIN";
                const canPost = isOwner || Boolean(membership);
                if (!canPost) {
                    socket.emit("chat:error", { message: "Not authorized to post in this workspace." });
                    return;
                }

                if (channel.isPrivate && !isAdmin) {
                    const userRoles = await prisma.workspaceUserRole.findMany({
                        where: { userId, role: { workspaceId: channel.workspaceId } },
                        select: { roleId: true },
                    });
                    const userRoleIds = new Set(userRoles.map((role) => role.roleId));
                    const hasAllowedRole = channel.allowedRoles.some((role) => userRoleIds.has(role.id));

                    if (!hasAllowedRole) {
                        socket.emit("chat:error", { message: "Not authorized to post in this channel." });
                        return;
                    }
                }

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
            console.log(`> App Mode: ${dev ? "DEVELOPMENT" : "PRODUCTION"}`);
            console.log(`> Ready on http://${hostname}:${port}`);
            console.log(`> Socket.IO server running`);

            if (autoReminderEnabled) {
                const reminderUrl = `http://127.0.0.1:${port}/api/internal/reminders`;
                const reminderFallbackUrl = `http://127.0.0.1:${port}/api/calendar/reminders/trigger`;
                console.log(`> Reminder worker enabled (${Math.floor(reminderIntervalMs / 1000)}s interval)`);

                const runReminderTick = async () => {
                    try {
                        let res = await fetch(reminderUrl, { headers: internalRequestHeaders });
                        if (res.status === 404) {
                            res = await fetch(reminderFallbackUrl, { headers: internalRequestHeaders });
                        }
                        if (!res.ok) {
                            console.warn(`[ReminderWorker] Trigger failed: ${res.status}`);
                        }
                    } catch (err) {
                        console.warn("[ReminderWorker] Trigger error:", err?.message || err);
                    }
                };

                setTimeout(runReminderTick, 5000);
                const timer = setInterval(runReminderTick, reminderIntervalMs);
                if (typeof timer.unref === "function") timer.unref();
            }

            if (autoOutreachReplyEnabled) {
                const outreachReplyUrl = `http://127.0.0.1:${port}/api/internal/outreach-replies`;
                const outreachReplyFallbackUrl = `http://127.0.0.1:${port}/api/outreach/replies/trigger`;
                console.log(`> Outreach reply worker enabled (${Math.floor(outreachReplyIntervalMs / 1000)}s interval)`);

                const runOutreachReplyTick = async () => {
                    try {
                        let res = await fetch(outreachReplyUrl, { headers: internalRequestHeaders });
                        if (res.status === 404) {
                            res = await fetch(outreachReplyFallbackUrl, { headers: internalRequestHeaders });
                        }
                        if (!res.ok) {
                            console.warn(`[OutreachReplyWorker] Trigger failed: ${res.status}`);
                        }
                    } catch (err) {
                        console.warn("[OutreachReplyWorker] Trigger error:", err?.message || err);
                    }
                };

                setTimeout(runOutreachReplyTick, 8000);
                const timer = setInterval(runOutreachReplyTick, outreachReplyIntervalMs);
                if (typeof timer.unref === "function") timer.unref();
            }
        });
});
