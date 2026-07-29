-- AlterTable: add status, bannedAt, bannedBy to User
ALTER TABLE "User" ADD COLUMN "status" TEXT NOT NULL DEFAULT 'ACTIVE';
ALTER TABLE "User" ADD COLUMN "bannedAt" DATETIME;
ALTER TABLE "User" ADD COLUMN "bannedBy" TEXT;
