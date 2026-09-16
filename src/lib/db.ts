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

// Ensure Calendly columns on CalendarSettings exist
prisma.$executeRawUnsafe('ALTER TABLE "CalendarSettings" ADD COLUMN "weeklySchedule" TEXT;').catch(() => {});
prisma.$executeRawUnsafe('ALTER TABLE "CalendarSettings" ADD COLUMN "bufferMinutes" INTEGER NOT NULL DEFAULT 0;').catch(() => {});
prisma.$executeRawUnsafe('ALTER TABLE "CalendarSettings" ADD COLUMN "noticeHours" INTEGER NOT NULL DEFAULT 2;').catch(() => {});
prisma.$executeRawUnsafe('ALTER TABLE "CalendarSettings" ADD COLUMN "bookingWindowDays" INTEGER NOT NULL DEFAULT 60;').catch(() => {});
prisma.$executeRawUnsafe('ALTER TABLE "CalendarSettings" ADD COLUMN "bookingSlug" TEXT;').catch(() => {});

// Ensure EventType table and indexes exist
prisma.$executeRawUnsafe(`
  CREATE TABLE IF NOT EXISTS "EventType" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "description" TEXT,
    "duration" INTEGER NOT NULL DEFAULT 30,
    "color" TEXT NOT NULL DEFAULT '#006bff',
    "locationType" TEXT NOT NULL DEFAULT 'VIDEO',
    "locationDetails" TEXT,
    "isActive" INTEGER NOT NULL DEFAULT 1,
    "bufferBefore" INTEGER NOT NULL DEFAULT 0,
    "bufferAfter" INTEGER NOT NULL DEFAULT 0,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "EventType_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE
  );
`).then(async () => {
  await prisma.$executeRawUnsafe(`CREATE UNIQUE INDEX IF NOT EXISTS "EventType_userId_slug_key" ON "EventType"("userId", "slug");`).catch(() => {});
  await prisma.$executeRawUnsafe(`CREATE INDEX IF NOT EXISTS "EventType_userId_idx" ON "EventType"("userId");`).catch(() => {});
}).catch(() => {});


