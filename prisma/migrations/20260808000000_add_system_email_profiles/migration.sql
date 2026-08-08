-- CreateTable
CREATE TABLE "SystemEmailProfile" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "profile" TEXT NOT NULL,
    "host" TEXT,
    "port" INTEGER NOT NULL DEFAULT 587,
    "username" TEXT,
    "password" TEXT,
    "fromEmail" TEXT,
    "fromName" TEXT,
    "secureMode" TEXT NOT NULL DEFAULT 'STARTTLS',
    "isEnabled" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateIndex
CREATE UNIQUE INDEX "SystemEmailProfile_profile_key" ON "SystemEmailProfile"("profile");
