import crypto from "node:crypto";
import { prisma } from "@/lib/db";
import type { BritCrmMcpContext } from "@/mcp/context";

export type McpAccessTokenSummary = {
  id: string;
  name: string;
  lastFour: string;
  createdAt: Date;
  updatedAt: Date;
  lastUsedAt: Date | null;
  expiresAt: Date | null;
  revokedAt: Date | null;
};

type TokenRow = McpAccessTokenSummary & {
  userId: string;
  tokenHash: string;
};

let tableReady = false;

function hashToken(token: string) {
  return crypto.createHash("sha256").update(token).digest("hex");
}

function normalizeDate(value: unknown) {
  if (!value) return null;
  return value instanceof Date ? value : new Date(String(value));
}

function normalizeRow(row: any): McpAccessTokenSummary {
  return {
    id: String(row.id),
    name: String(row.name || "MCP Agent"),
    lastFour: String(row.lastFour || row.last_four || ""),
    createdAt: normalizeDate(row.createdAt || row.created_at) || new Date(),
    updatedAt: normalizeDate(row.updatedAt || row.updated_at) || new Date(),
    lastUsedAt: normalizeDate(row.lastUsedAt || row.last_used_at),
    expiresAt: normalizeDate(row.expiresAt || row.expires_at),
    revokedAt: normalizeDate(row.revokedAt || row.revoked_at),
  };
}

export async function ensureMcpAccessTokenTable() {
  if (tableReady) return;
  await prisma.$executeRawUnsafe(`
    CREATE TABLE IF NOT EXISTS "McpAccessToken" (
      "id" TEXT NOT NULL PRIMARY KEY,
      "userId" TEXT NOT NULL,
      "name" TEXT NOT NULL DEFAULT 'MCP Agent',
      "tokenHash" TEXT NOT NULL,
      "lastFour" TEXT NOT NULL,
      "lastUsedAt" DATETIME,
      "revokedAt" DATETIME,
      "expiresAt" DATETIME,
      "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
      "updatedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
      CONSTRAINT "McpAccessToken_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE
    )
  `);
  await prisma.$executeRawUnsafe(`CREATE UNIQUE INDEX IF NOT EXISTS "McpAccessToken_tokenHash_key" ON "McpAccessToken"("tokenHash")`);
  await prisma.$executeRawUnsafe(`CREATE INDEX IF NOT EXISTS "McpAccessToken_userId_idx" ON "McpAccessToken"("userId")`);
  tableReady = true;
}

export async function createMcpAccessToken(userId: string, name?: string) {
  await ensureMcpAccessTokenTable();

  const token = `bcrm_mcp_${crypto.randomBytes(32).toString("base64url")}`;
  const now = new Date();
  const record = {
    id: crypto.randomUUID(),
    userId,
    name: (name || "MCP Agent").trim().slice(0, 80) || "MCP Agent",
    tokenHash: hashToken(token),
    lastFour: token.slice(-4),
    now: now.toISOString(),
  };

  await prisma.$executeRawUnsafe(
    `INSERT INTO "McpAccessToken" ("id", "userId", "name", "tokenHash", "lastFour", "createdAt", "updatedAt") VALUES (?, ?, ?, ?, ?, ?, ?)`,
    record.id,
    record.userId,
    record.name,
    record.tokenHash,
    record.lastFour,
    record.now,
    record.now,
  );
  await prisma.activityLog.create({
    data: {
      userId,
      action: "MCP_TOKEN_CREATED",
      details: `Created MCP token "${record.name}" ending in ${record.lastFour}`,
    },
  });

  return {
    token,
    summary: {
      id: record.id,
      name: record.name,
      lastFour: record.lastFour,
      createdAt: now,
      updatedAt: now,
      lastUsedAt: null,
      expiresAt: null,
      revokedAt: null,
    } satisfies McpAccessTokenSummary,
  };
}

export async function listMcpAccessTokens(userId: string) {
  await ensureMcpAccessTokenTable();
  const rows = await prisma.$queryRawUnsafe<any[]>(
    `SELECT "id", "name", "lastFour", "createdAt", "updatedAt", "lastUsedAt", "expiresAt", "revokedAt"
     FROM "McpAccessToken"
     WHERE "userId" = ?
     ORDER BY "createdAt" DESC`,
    userId,
  );

  return rows.map(normalizeRow);
}

export async function revokeMcpAccessToken(userId: string, tokenId: string) {
  await ensureMcpAccessTokenTable();
  const existing = await prisma.$queryRawUnsafe<Array<{ name: string; lastFour: string }>>(
    `SELECT "name", "lastFour" FROM "McpAccessToken" WHERE "id" = ? AND "userId" = ? LIMIT 1`,
    tokenId,
    userId,
  );
  const now = new Date().toISOString();
  await prisma.$executeRawUnsafe(
    `UPDATE "McpAccessToken" SET "revokedAt" = ?, "updatedAt" = ? WHERE "id" = ? AND "userId" = ? AND "revokedAt" IS NULL`,
    now,
    now,
    tokenId,
    userId,
  );
  if (existing[0]) {
    await prisma.activityLog.create({
      data: {
        userId,
        action: "MCP_TOKEN_REVOKED",
        details: `Revoked MCP token "${existing[0].name}" ending in ${existing[0].lastFour}`,
      },
    });
  }
}

export async function resolveMcpBearerToken(token: string): Promise<BritCrmMcpContext | null> {
  if (!/^bcrm_mcp_[A-Za-z0-9_-]{32,}$/.test(token)) return null;
  await ensureMcpAccessTokenTable();

  const rows = await prisma.$queryRawUnsafe<Array<TokenRow & { email: string; role: string; status: string }>>(
    `SELECT t.*, u."email", u."role", u."status"
     FROM "McpAccessToken" t
     INNER JOIN "User" u ON u."id" = t."userId"
     WHERE t."tokenHash" = ?
     LIMIT 1`,
    hashToken(token),
  );

  const row = rows[0];
  if (!row || row.revokedAt || (row.status && row.status !== "ACTIVE")) return null;
  const expiresAt = normalizeDate(row.expiresAt);
  if (expiresAt && expiresAt.getTime() <= Date.now()) return null;

  const now = new Date().toISOString();
  await prisma.$executeRawUnsafe(`UPDATE "McpAccessToken" SET "lastUsedAt" = ?, "updatedAt" = ? WHERE "id" = ?`, now, now, row.id);

  return {
    userId: row.userId,
    role: row.role,
    email: row.email,
  };
}
