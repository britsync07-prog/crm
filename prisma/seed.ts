import { PrismaClient } from "@prisma/client";
import { PrismaBetterSqlite3 } from "@prisma/adapter-better-sqlite3";
import bcrypt from "bcrypt";

const adapter = new PrismaBetterSqlite3({ url: process.env.DATABASE_URL || "file:prisma/dev.db" });
const prisma = new PrismaClient({ adapter });

async function main() {
  const email = process.env.ADMIN_EMAIL || "admin@britsyncai.com";
  const password = process.env.ADMIN_PASSWORD || "Admin123!";

  const existing = await prisma.user.findUnique({ where: { email } });

  if (existing) {
    await prisma.user.update({
      where: { email },
      data: { role: "ADMIN" },
    });
    console.log(`User ${email} promoted to ADMIN`);
  } else {
    const hashed = await bcrypt.hash(password, 10);
    const user = await prisma.user.create({
      data: {
        name: "Admin",
        email,
        password: hashed,
        role: "ADMIN",
        isVerified: true,
      },
    });
    console.log(`Admin user created: ${email} / ${password}`);
  }
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
