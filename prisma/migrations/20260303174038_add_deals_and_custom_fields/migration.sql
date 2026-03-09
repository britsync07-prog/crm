-- AlterTable
ALTER TABLE "Customer" ADD COLUMN "areaOfOperation" TEXT;
ALTER TABLE "Customer" ADD COLUMN "budgetRange" TEXT;
ALTER TABLE "Customer" ADD COLUMN "dealFocus" TEXT;
ALTER TABLE "Customer" ADD COLUMN "licenseType" TEXT;

-- AlterTable
ALTER TABLE "Lead" ADD COLUMN "areaOfOperation" TEXT;
ALTER TABLE "Lead" ADD COLUMN "budgetRange" TEXT;
ALTER TABLE "Lead" ADD COLUMN "dealFocus" TEXT;
ALTER TABLE "Lead" ADD COLUMN "licenseType" TEXT;

-- CreateTable
CREATE TABLE "Deal" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "value" REAL NOT NULL DEFAULT 0,
    "stage" TEXT NOT NULL DEFAULT 'New Lead',
    "expectedClose" DATETIME,
    "leadId" TEXT,
    "customerId" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "Deal_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "Deal_leadId_fkey" FOREIGN KEY ("leadId") REFERENCES "Lead" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "Deal_customerId_fkey" FOREIGN KEY ("customerId") REFERENCES "Customer" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);
