CREATE TABLE "McpAccessToken" (
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
);

CREATE UNIQUE INDEX "McpAccessToken_tokenHash_key" ON "McpAccessToken"("tokenHash");
CREATE INDEX "McpAccessToken_userId_idx" ON "McpAccessToken"("userId");
