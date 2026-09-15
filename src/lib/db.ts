import { PrismaClient } from "@prisma/client";
import { PrismaBetterSqlite3 } from "@prisma/adapter-better-sqlite3";

const globalForPrisma = global as unknown as { prisma_v4: PrismaClient };

const adapter = new PrismaBetterSqlite3({ url: process.env.DATABASE_URL || "file:prisma/dev.db" });

export const prisma =
  globalForPrisma.prisma_v4 ||
  new PrismaClient({ adapter });

if (process.env.NODE_ENV !== "production") globalForPrisma.prisma_v4 = prisma;

// Ensure WAL mode is active
prisma.$executeRawUnsafe("PRAGMA journal_mode = WAL;").catch((err) => {
  console.error("Failed to set WAL mode:", err);
});

// Ensure lastResetAt column exists on EmailAccount in production databases
prisma.$executeRawUnsafe('ALTER TABLE "EmailAccount" ADD COLUMN "lastResetAt" DATETIME;').catch(() => {
  // Ignored if column already exists or table not yet created
});

