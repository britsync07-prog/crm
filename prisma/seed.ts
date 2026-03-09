import { PrismaBetterSqlite3 } from "@prisma/adapter-better-sqlite3";
import { PrismaClient } from ".prisma/client";
import "dotenv/config";
import bcrypt from "bcrypt";

const adapter = new PrismaBetterSqlite3({ url: "file:prisma/dev.db" });
const prisma = new PrismaClient({ adapter });

async function main() {
  console.log("Seeding production-ready data...");

  // Manual cleanup since deleteMany might fail if models aren't ready
  try {
    const hashedPassword = await bcrypt.hash("admin123", 10);
    
    // Create user if not exists
    const user = await prisma.user.upsert({
      where: { email: "admin@crm.com" },
      update: {},
      create: {
        name: "Admin User",
        email: "admin@crm.com",
        password: hashedPassword,
        role: "ADMIN",
        isVerified: true,
      },
    });

    console.log("Admin user ready.");
  } catch (e) {
    console.error("Seed failed:", e);
  }
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  });
