import crypto from "node:crypto";
import { prisma } from "@/lib/db";
import type { BritCrmMcpContext } from "@/mcp/context";

export type OAuthClientSummary = {
  id: string;
  userId: string;
  name: string;
  clientId: string;
  clientSecret: string;
  redirectUris: string[];
  grantTypes: string[];
  responseTypes: string[];
  scopes: string[];
  createdAt: Date;
  updatedAt: Date;
  revokedAt: Date | null;
  activeTokenCount?: number;
};

export type OAuthTokenResult = {
  accessToken: string;
  refreshToken?: string;
  tokenType: "Bearer";
  expiresIn: number;
  scope: string;
};

let oauthTablesReady = false;

export function hashValue(value: string): string {
  return crypto.createHash("sha256").update(value).digest("hex");
}

function normalizeDate(value: unknown): Date | null {
  if (!value) return null;
  return value instanceof Date ? value : new Date(String(value));
}

function parseJsonArray(value: unknown, fallback: string[] = []): string[] {
  if (!value) return fallback;
  if (Array.isArray(value)) return value.map(String);
  try {
    const parsed = JSON.parse(String(value));
    return Array.isArray(parsed) ? parsed.map(String) : fallback;
  } catch {
    return fallback;
  }
}

export async function ensureOAuthTables(): Promise<void> {
  if (oauthTablesReady) return;

  await prisma.$executeRawUnsafe(`
    CREATE TABLE IF NOT EXISTS "OAuthClient" (
      "id" TEXT NOT NULL PRIMARY KEY,
      "userId" TEXT NOT NULL,
      "name" TEXT NOT NULL DEFAULT 'Gemini Connected App',
      "clientId" TEXT NOT NULL,
      "clientSecret" TEXT NOT NULL,
      "clientSecretHash" TEXT NOT NULL,
      "redirectUris" TEXT NOT NULL DEFAULT '[]',
      "grantTypes" TEXT NOT NULL DEFAULT '["authorization_code","refresh_token","client_credentials"]',
      "responseTypes" TEXT NOT NULL DEFAULT '["code"]',
      "scopes" TEXT NOT NULL DEFAULT '["mcp","crm","read","write"]',
      "isConfidential" INTEGER NOT NULL DEFAULT 1,
      "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
      "updatedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
      "revokedAt" DATETIME,
      CONSTRAINT "OAuthClient_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE
    )
  `);

  await prisma.$executeRawUnsafe(`CREATE UNIQUE INDEX IF NOT EXISTS "OAuthClient_clientId_key" ON "OAuthClient"("clientId")`);
  await prisma.$executeRawUnsafe(`CREATE INDEX IF NOT EXISTS "OAuthClient_userId_idx" ON "OAuthClient"("userId")`);

  await prisma.$executeRawUnsafe(`
    CREATE TABLE IF NOT EXISTS "OAuthAuthCode" (
      "id" TEXT NOT NULL PRIMARY KEY,
      "codeHash" TEXT NOT NULL,
      "clientId" TEXT NOT NULL,
      "userId" TEXT NOT NULL,
      "redirectUri" TEXT NOT NULL,
      "codeChallenge" TEXT,
      "codeChallengeMethod" TEXT NOT NULL DEFAULT 'S256',
      "scope" TEXT NOT NULL DEFAULT 'mcp',
      "expiresAt" DATETIME NOT NULL,
      "usedAt" DATETIME,
      "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
      CONSTRAINT "OAuthAuthCode_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE
    )
  `);

  await prisma.$executeRawUnsafe(`CREATE UNIQUE INDEX IF NOT EXISTS "OAuthAuthCode_codeHash_key" ON "OAuthAuthCode"("codeHash")`);
  await prisma.$executeRawUnsafe(`CREATE INDEX IF NOT EXISTS "OAuthAuthCode_clientId_idx" ON "OAuthAuthCode"("clientId")`);

  await prisma.$executeRawUnsafe(`
    CREATE TABLE IF NOT EXISTS "OAuthToken" (
      "id" TEXT NOT NULL PRIMARY KEY,
      "userId" TEXT NOT NULL,
      "clientId" TEXT,
      "accessTokenHash" TEXT NOT NULL,
      "refreshTokenHash" TEXT,
      "tokenType" TEXT NOT NULL DEFAULT 'Bearer',
      "scope" TEXT NOT NULL DEFAULT 'mcp',
      "expiresAt" DATETIME NOT NULL,
      "revokedAt" DATETIME,
      "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
      "updatedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
      "lastUsedAt" DATETIME,
      CONSTRAINT "OAuthToken_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE
    )
  `);

  await prisma.$executeRawUnsafe(`CREATE UNIQUE INDEX IF NOT EXISTS "OAuthToken_accessTokenHash_key" ON "OAuthToken"("accessTokenHash")`);
  await prisma.$executeRawUnsafe(`CREATE INDEX IF NOT EXISTS "OAuthToken_refreshTokenHash_idx" ON "OAuthToken"("refreshTokenHash")`);
  await prisma.$executeRawUnsafe(`CREATE INDEX IF NOT EXISTS "OAuthToken_userId_idx" ON "OAuthToken"("userId")`);

  oauthTablesReady = true;
}

export async function createOAuthClient(params: {
  userId: string;
  name?: string;
  redirectUris?: string[];
  grantTypes?: string[];
  scopes?: string[];
  isConfidential?: boolean;
}): Promise<OAuthClientSummary> {
  await ensureOAuthTables();

  const id = crypto.randomUUID();
  const clientId = `bcrm_client_${crypto.randomBytes(16).toString("hex")}`;
  const clientSecret = `bcrm_secret_${crypto.randomBytes(24).toString("base64url")}`;
  const clientSecretHash = hashValue(clientSecret);
  const now = new Date();

  const defaultRedirects = [
    "https://gemini.google.com/oauth/callback",
    "https://gemini.google.com",
    "http://localhost:3000/oauth/callback",
    "http://localhost:8080/oauth/callback",
  ];

  const redirectUris = params.redirectUris && params.redirectUris.length > 0 ? params.redirectUris : defaultRedirects;
  const grantTypes = params.grantTypes || ["authorization_code", "refresh_token", "client_credentials"];
  const responseTypes = ["code"];
  const scopes = params.scopes || ["mcp", "crm", "read", "write", "offline_access"];
  const name = (params.name || "Gemini Spark Connected App").trim().slice(0, 100);
  const isConfidential = params.isConfidential !== false ? 1 : 0;

  await prisma.$executeRawUnsafe(
    `INSERT INTO "OAuthClient" (
      "id", "userId", "name", "clientId", "clientSecret", "clientSecretHash",
      "redirectUris", "grantTypes", "responseTypes", "scopes", "isConfidential",
      "createdAt", "updatedAt"
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    id,
    params.userId,
    name,
    clientId,
    clientSecret,
    clientSecretHash,
    JSON.stringify(redirectUris),
    JSON.stringify(grantTypes),
    JSON.stringify(responseTypes),
    JSON.stringify(scopes),
    isConfidential,
    now.toISOString(),
    now.toISOString(),
  );

  await prisma.activityLog.create({
    data: {
      userId: params.userId,
      action: "OAUTH_CLIENT_CREATED",
      details: `Created OAuth client "${name}" (${clientId})`,
    },
  });

  return {
    id,
    userId: params.userId,
    name,
    clientId,
    clientSecret,
    redirectUris,
    grantTypes,
    responseTypes,
    scopes,
    createdAt: now,
    updatedAt: now,
    revokedAt: null,
  };
}

export async function listOAuthClients(userId: string): Promise<OAuthClientSummary[]> {
  await ensureOAuthTables();

  const rows = await prisma.$queryRawUnsafe<any[]>(
    `SELECT c.*,
       (SELECT COUNT(*) FROM "OAuthToken" t WHERE t."clientId" = c."clientId" AND t."revokedAt" IS NULL AND t."expiresAt" > CURRENT_TIMESTAMP) as "activeTokenCount"
     FROM "OAuthClient" c
     WHERE c."userId" = ?
     ORDER BY c."createdAt" DESC`,
    userId,
  );

  return rows.map((row) => ({
    id: String(row.id),
    userId: String(row.userId),
    name: String(row.name || "OAuth Client"),
    clientId: String(row.clientId),
    clientSecret: String(row.clientSecret || ""),
    redirectUris: parseJsonArray(row.redirectUris),
    grantTypes: parseJsonArray(row.grantTypes),
    responseTypes: parseJsonArray(row.responseTypes),
    scopes: parseJsonArray(row.scopes),
    createdAt: normalizeDate(row.createdAt) || new Date(),
    updatedAt: normalizeDate(row.updatedAt) || new Date(),
    revokedAt: normalizeDate(row.revokedAt),
    activeTokenCount: Number(row.activeTokenCount || 0),
  }));
}

export async function getOAuthClientByClientId(clientId: string): Promise<OAuthClientSummary | null> {
  await ensureOAuthTables();

  const rows = await prisma.$queryRawUnsafe<any[]>(
    `SELECT * FROM "OAuthClient" WHERE "clientId" = ? AND "revokedAt" IS NULL LIMIT 1`,
    clientId,
  );

  if (!rows || rows.length === 0) return null;
  const row = rows[0];

  return {
    id: String(row.id),
    userId: String(row.userId),
    name: String(row.name || "OAuth Client"),
    clientId: String(row.clientId),
    clientSecret: String(row.clientSecret || ""),
    redirectUris: parseJsonArray(row.redirectUris),
    grantTypes: parseJsonArray(row.grantTypes),
    responseTypes: parseJsonArray(row.responseTypes),
    scopes: parseJsonArray(row.scopes),
    createdAt: normalizeDate(row.createdAt) || new Date(),
    updatedAt: normalizeDate(row.updatedAt) || new Date(),
    revokedAt: normalizeDate(row.revokedAt),
  };
}

export async function validateOAuthClient(clientId: string, clientSecret?: string | null): Promise<OAuthClientSummary | null> {
  const client = await getOAuthClientByClientId(clientId);
  if (!client) return null;

  if (clientSecret) {
    if (client.clientSecret !== clientSecret && hashValue(clientSecret) !== hashValue(client.clientSecret)) {
      return null;
    }
  }

  return client;
}

export async function revokeOAuthClient(userId: string, clientId: string): Promise<boolean> {
  await ensureOAuthTables();

  const client = await prisma.$queryRawUnsafe<any[]>(
    `SELECT "id", "name", "clientId" FROM "OAuthClient" WHERE "clientId" = ? AND "userId" = ? LIMIT 1`,
    clientId,
    userId,
  );

  if (!client || client.length === 0) return false;

  const now = new Date().toISOString();
  await prisma.$executeRawUnsafe(
    `UPDATE "OAuthClient" SET "revokedAt" = ?, "updatedAt" = ? WHERE "clientId" = ? AND "userId" = ?`,
    now,
    now,
    clientId,
    userId,
  );

  await prisma.$executeRawUnsafe(
    `UPDATE "OAuthToken" SET "revokedAt" = ?, "updatedAt" = ? WHERE "clientId" = ? AND "revokedAt" IS NULL`,
    now,
    now,
    clientId,
  );

  await prisma.activityLog.create({
    data: {
      userId,
      action: "OAUTH_CLIENT_REVOKED",
      details: `Revoked OAuth client "${client[0].name}" (${clientId})`,
    },
  });

  return true;
}

export async function createOAuthAuthCode(params: {
  clientId: string;
  userId: string;
  redirectUri: string;
  codeChallenge?: string | null;
  codeChallengeMethod?: string | null;
  scope?: string | null;
}): Promise<string> {
  await ensureOAuthTables();

  const code = `bcrm_code_${crypto.randomBytes(32).toString("base64url")}`;
  const codeHash = hashValue(code);
  const id = crypto.randomUUID();
  const expiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes valid
  const challengeMethod = (params.codeChallengeMethod || "S256").toUpperCase();

  await prisma.$executeRawUnsafe(
    `INSERT INTO "OAuthAuthCode" (
      "id", "codeHash", "clientId", "userId", "redirectUri",
      "codeChallenge", "codeChallengeMethod", "scope", "expiresAt", "createdAt"
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    id,
    codeHash,
    params.clientId,
    params.userId,
    params.redirectUri,
    params.codeChallenge || null,
    challengeMethod,
    params.scope || "mcp",
    expiresAt.toISOString(),
    new Date().toISOString(),
  );

  return code;
}

function verifyPkce(verifier: string, challenge: string, method: string): boolean {
  if (method === "PLAIN") {
    return verifier === challenge;
  }
  const hash = crypto.createHash("sha256").update(verifier).digest("base64url");
  return hash === challenge;
}

export async function exchangeOAuthAuthCode(params: {
  code: string;
  clientId: string;
  clientSecret?: string | null;
  codeVerifier?: string | null;
  redirectUri?: string | null;
}): Promise<OAuthTokenResult> {
  await ensureOAuthTables();

  const codeHash = hashValue(params.code);
  const rows = await prisma.$queryRawUnsafe<any[]>(
    `SELECT * FROM "OAuthAuthCode" WHERE "codeHash" = ? AND "clientId" = ? LIMIT 1`,
    codeHash,
    params.clientId,
  );

  if (!rows || rows.length === 0) {
    throw new Error("Invalid or unknown authorization code.");
  }

  const authCode = rows[0];
  if (authCode.usedAt) {
    throw new Error("Authorization code has already been used.");
  }

  const expiresAt = normalizeDate(authCode.expiresAt);
  if (!expiresAt || expiresAt.getTime() <= Date.now()) {
    throw new Error("Authorization code has expired.");
  }

  if (authCode.codeChallenge) {
    if (!params.codeVerifier) {
      throw new Error("Missing code_verifier for PKCE challenge.");
    }
    const method = String(authCode.codeChallengeMethod || "S256").toUpperCase();
    if (!verifyPkce(params.codeVerifier, authCode.codeChallenge, method)) {
      throw new Error("PKCE verification failed: code_verifier does not match code_challenge.");
    }
  }

  const now = new Date();
  await prisma.$executeRawUnsafe(
    `UPDATE "OAuthAuthCode" SET "usedAt" = ? WHERE "id" = ?`,
    now.toISOString(),
    authCode.id,
  );

  const accessToken = `bcrm_oa_acc_${crypto.randomBytes(32).toString("base64url")}`;
  const refreshToken = `bcrm_oa_ref_${crypto.randomBytes(32).toString("base64url")}`;
  const tokenExpiresAt = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000); // 30 days
  const tokenId = crypto.randomUUID();

  await prisma.$executeRawUnsafe(
    `INSERT INTO "OAuthToken" (
      "id", "userId", "clientId", "accessTokenHash", "refreshTokenHash",
      "tokenType", "scope", "expiresAt", "createdAt", "updatedAt"
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    tokenId,
    authCode.userId,
    authCode.clientId,
    hashValue(accessToken),
    hashValue(refreshToken),
    "Bearer",
    authCode.scope || "mcp",
    tokenExpiresAt.toISOString(),
    now.toISOString(),
    now.toISOString(),
  );

  return {
    accessToken,
    refreshToken,
    tokenType: "Bearer",
    expiresIn: 30 * 24 * 60 * 60,
    scope: authCode.scope || "mcp",
  };
}

export async function refreshOAuthToken(params: {
  refreshToken: string;
  clientId?: string | null;
  clientSecret?: string | null;
}): Promise<OAuthTokenResult> {
  await ensureOAuthTables();

  const refHash = hashValue(params.refreshToken);
  const rows = await prisma.$queryRawUnsafe<any[]>(
    `SELECT * FROM "OAuthToken" WHERE "refreshTokenHash" = ? AND "revokedAt" IS NULL LIMIT 1`,
    refHash,
  );

  if (!rows || rows.length === 0) {
    throw new Error("Invalid or revoked refresh token.");
  }

  const tokenRecord = rows[0];

  if (params.clientId && tokenRecord.clientId && tokenRecord.clientId !== params.clientId) {
    throw new Error("Refresh token does not belong to the specified client.");
  }

  const now = new Date();
  const newAccessToken = `bcrm_oa_acc_${crypto.randomBytes(32).toString("base64url")}`;
  const newRefreshToken = `bcrm_oa_ref_${crypto.randomBytes(32).toString("base64url")}`;
  const tokenExpiresAt = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);

  await prisma.$executeRawUnsafe(
    `UPDATE "OAuthToken" SET "revokedAt" = ?, "updatedAt" = ? WHERE "id" = ?`,
    now.toISOString(),
    now.toISOString(),
    tokenRecord.id,
  );

  const newId = crypto.randomUUID();
  await prisma.$executeRawUnsafe(
    `INSERT INTO "OAuthToken" (
      "id", "userId", "clientId", "accessTokenHash", "refreshTokenHash",
      "tokenType", "scope", "expiresAt", "createdAt", "updatedAt"
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    newId,
    tokenRecord.userId,
    tokenRecord.clientId,
    hashValue(newAccessToken),
    hashValue(newRefreshToken),
    "Bearer",
    tokenRecord.scope || "mcp",
    tokenExpiresAt.toISOString(),
    now.toISOString(),
    now.toISOString(),
  );

  return {
    accessToken: newAccessToken,
    refreshToken: newRefreshToken,
    tokenType: "Bearer",
    expiresIn: 30 * 24 * 60 * 60,
    scope: tokenRecord.scope || "mcp",
  };
}

export async function createClientCredentialsToken(params: {
  clientId: string;
  clientSecret: string;
  scope?: string | null;
}): Promise<OAuthTokenResult> {
  await ensureOAuthTables();

  const client = await validateOAuthClient(params.clientId, params.clientSecret);
  if (!client) {
    throw new Error("Invalid client credentials.");
  }

  const now = new Date();
  const accessToken = `bcrm_oa_acc_${crypto.randomBytes(32).toString("base64url")}`;
  const tokenExpiresAt = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);
  const tokenId = crypto.randomUUID();

  await prisma.$executeRawUnsafe(
    `INSERT INTO "OAuthToken" (
      "id", "userId", "clientId", "accessTokenHash", "tokenType",
      "scope", "expiresAt", "createdAt", "updatedAt"
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    tokenId,
    client.userId,
    client.clientId,
    hashValue(accessToken),
    "Bearer",
    params.scope || "mcp",
    tokenExpiresAt.toISOString(),
    now.toISOString(),
    now.toISOString(),
  );

  return {
    accessToken,
    tokenType: "Bearer",
    expiresIn: 30 * 24 * 60 * 60,
    scope: params.scope || "mcp",
  };
}

export async function resolveOAuthAccessToken(token: string): Promise<BritCrmMcpContext | null> {
  await ensureOAuthTables();

  const tokenHash = hashValue(token);
  const rows = await prisma.$queryRawUnsafe<any[]>(
    `SELECT t.*, u."email", u."role", u."status"
     FROM "OAuthToken" t
     INNER JOIN "User" u ON u."id" = t."userId"
     WHERE t."accessTokenHash" = ? AND t."revokedAt" IS NULL
     LIMIT 1`,
    tokenHash,
  );

  if (!rows || rows.length === 0) return null;
  const row = rows[0];

  if (row.status && row.status !== "ACTIVE") return null;

  const expiresAt = normalizeDate(row.expiresAt);
  if (expiresAt && expiresAt.getTime() <= Date.now()) return null;

  const now = new Date().toISOString();
  await prisma.$executeRawUnsafe(
    `UPDATE "OAuthToken" SET "lastUsedAt" = ?, "updatedAt" = ? WHERE "id" = ?`,
    now,
    now,
    row.id,
  );

  return {
    userId: String(row.userId),
    role: String(row.role || "USER"),
    email: String(row.email),
  };
}

export async function revokeOAuthToken(token: string): Promise<boolean> {
  await ensureOAuthTables();

  const tokenHash = hashValue(token);
  const now = new Date().toISOString();

  await prisma.$executeRawUnsafe(
    `UPDATE "OAuthToken" SET "revokedAt" = ?, "updatedAt" = ? WHERE ("accessTokenHash" = ? OR "refreshTokenHash" = ?) AND "revokedAt" IS NULL`,
    now,
    now,
    tokenHash,
    tokenHash,
  );

  return true;
}
