import { PrismaClient } from "@prisma/client";
import { PrismaBetterSqlite3 } from "@prisma/adapter-better-sqlite3";
import bcrypt from "bcrypt";

const [, , emailArg, passwordArg, ...nameParts] = process.argv;
const email = emailArg?.trim().toLowerCase();
const password = passwordArg || "";
const name = nameParts.join(" ").trim() || "Admin";

if (!email || !email.includes("@") || password.length < 8) {
  console.error("Usage: npm run admin:create -- admin@example.com StrongPassword123 \"Admin Name\"");
  console.error("Password must be at least 8 characters.");
  process.exit(1);
}

const adapter = new PrismaBetterSqlite3({ url: process.env.DATABASE_URL || "file:prisma/dev.db" });
const prisma = new PrismaClient({ adapter });

async function main() {
  const hashedPassword = await bcrypt.hash(password, 10);
  const existing = await prisma.user.findUnique({ where: { email } });

  const user = existing
    ? await prisma.user.update({
        where: { email },
        data: { role: "ADMIN", status: "ACTIVE", password: hashedPassword, name: existing.name || name },
      })
    : await prisma.user.create({
        data: { email, name, password: hashedPassword, role: "ADMIN", status: "ACTIVE", isVerified: true },
      });

  let org = await prisma.organization.findFirst({ where: { ownerId: user.id } });
  if (!org) {
    org = await prisma.organization.create({
      data: {
        name: `${name}'s Organization`,
        ownerId: user.id,
        plan: "enterprise",
        seatLimit: 100,
        subscriptionStatus: "active",
      },
    });
  }

  await prisma.organizationMember.upsert({
    where: { organizationId_email: { organizationId: org.id, email } },
    update: { userId: user.id, role: "admin", status: "active", lastActive: new Date() },
    create: {
      organizationId: org.id,
      userId: user.id,
      email,
      role: "admin",
      status: "active",
      invitedById: user.id,
      lastActive: new Date(),
    },
  });

  await prisma.user.update({ where: { id: user.id }, data: { organizationId: org.id } });

  console.log(existing ? `Promoted admin: ${email}` : `Created admin: ${email}`);
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
