const path = require('path');
const fs = require('fs');

try {
  const Database = require('better-sqlite3');
  let dbPath = path.resolve(process.cwd(), 'prisma', 'dev.db');
  if (process.env.DATABASE_URL && process.env.DATABASE_URL.startsWith('file:')) {
    const rawPath = process.env.DATABASE_URL.replace(/^file:/, '').trim();
    const candidatePath = path.isAbsolute(rawPath) ? rawPath : path.resolve(process.cwd(), rawPath);
    if (fs.existsSync(candidatePath) || !fs.existsSync(dbPath)) {
      dbPath = candidatePath;
    }
  }

  if (!fs.existsSync(dbPath)) {
    console.log('[init-referral-db] DB file does not exist yet at:', dbPath);
  } else {
    console.log('[init-referral-db] Opening SQLite DB at:', dbPath);
    const db = new Database(dbPath);

    // 1. ReferralLink table
    db.exec(`
      CREATE TABLE IF NOT EXISTS "ReferralLink" (
        "id" TEXT NOT NULL PRIMARY KEY,
        "code" TEXT NOT NULL COLLATE NOCASE,
        "agencyName" TEXT NOT NULL,
        "targetUrl" TEXT NOT NULL DEFAULT '/',
        "notes" TEXT,
        "isActive" BOOLEAN NOT NULL DEFAULT 1,
        "visitsCount" INTEGER NOT NULL DEFAULT 0,
        "uniqueVisitsCount" INTEGER NOT NULL DEFAULT 0,
        "signupsCount" INTEGER NOT NULL DEFAULT 0,
        "purchasesCount" INTEGER NOT NULL DEFAULT 0,
        "totalRevenue" REAL NOT NULL DEFAULT 0.0,
        "createdBy" TEXT,
        "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
        "updatedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
      );
      CREATE UNIQUE INDEX IF NOT EXISTS "ReferralLink_code_key" ON "ReferralLink"("code");
    `);

    // 2. ReferralVisit table
    db.exec(`
      CREATE TABLE IF NOT EXISTS "ReferralVisit" (
        "id" TEXT NOT NULL PRIMARY KEY,
        "referralLinkId" TEXT NOT NULL,
        "visitorId" TEXT NOT NULL,
        "ip" TEXT,
        "userAgent" TEXT,
        "referer" TEXT,
        "landingPath" TEXT,
        "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
        CONSTRAINT "ReferralVisit_referralLinkId_fkey" FOREIGN KEY ("referralLinkId") REFERENCES "ReferralLink" ("id") ON DELETE CASCADE ON UPDATE CASCADE
      );
      CREATE INDEX IF NOT EXISTS "ReferralVisit_referralLinkId_idx" ON "ReferralVisit"("referralLinkId");
      CREATE INDEX IF NOT EXISTS "ReferralVisit_visitorId_idx" ON "ReferralVisit"("visitorId");
      CREATE INDEX IF NOT EXISTS "ReferralVisit_createdAt_idx" ON "ReferralVisit"("createdAt");
    `);

    // 3. ReferralConversion table
    db.exec(`
      CREATE TABLE IF NOT EXISTS "ReferralConversion" (
        "id" TEXT NOT NULL PRIMARY KEY,
        "referralLinkId" TEXT NOT NULL,
        "type" TEXT NOT NULL,
        "userId" TEXT,
        "userEmail" TEXT,
        "organizationId" TEXT,
        "plan" TEXT,
        "amount" REAL NOT NULL DEFAULT 0.0,
        "currency" TEXT NOT NULL DEFAULT 'USD',
        "stripeSessionId" TEXT,
        "metadataJson" TEXT,
        "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
        CONSTRAINT "ReferralConversion_referralLinkId_fkey" FOREIGN KEY ("referralLinkId") REFERENCES "ReferralLink" ("id") ON DELETE CASCADE ON UPDATE CASCADE
      );
      CREATE INDEX IF NOT EXISTS "ReferralConversion_referralLinkId_idx" ON "ReferralConversion"("referralLinkId");
      CREATE INDEX IF NOT EXISTS "ReferralConversion_userId_idx" ON "ReferralConversion"("userId");
      CREATE INDEX IF NOT EXISTS "ReferralConversion_type_idx" ON "ReferralConversion"("type");
      CREATE INDEX IF NOT EXISTS "ReferralConversion_createdAt_idx" ON "ReferralConversion"("createdAt");
    `);

    // 4. Alter User table to add referralLinkId if not exists
    try {
      db.exec(`ALTER TABLE "User" ADD COLUMN "referralLinkId" TEXT;`);
      console.log('[init-referral-db] Added referralLinkId column to User table');
    } catch (e) {
      // Column already exists, ignore
    }

    try {
      db.exec(`CREATE INDEX IF NOT EXISTS "User_referralLinkId_idx" ON "User"("referralLinkId");`);
    } catch (e) {
      // Ignore
    }

    console.log('[init-referral-db] All referral tables and indexes initialized successfully.');
    db.close();
  }
} catch (err) {
  console.error('[init-referral-db] Error initializing referral database tables:', err);
}
