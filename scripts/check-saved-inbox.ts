import { PrismaClient } from "@prisma/client";
import { PrismaBetterSqlite3 } from "@prisma/adapter-better-sqlite3";
import { fetchRecentEmails } from "../src/lib/imap";

const adapter = new PrismaBetterSqlite3({ url: process.env.DATABASE_URL || "file:prisma/dev.db" });
const prisma = new PrismaClient({ adapter });

async function main() {
  const accounts = await prisma.emailAccount.findMany({ orderBy: { id: "desc" } });
  for (const account of accounts) {
    try {
      const emails = await fetchRecentEmails(account, "INBOX");
      console.log(JSON.stringify({
        account: account.email,
        ok: true,
        count: emails.length,
        subjects: emails.map((email: any) => email.subject).slice(0, 5),
      }, null, 2));
    } catch (error: any) {
      console.log(JSON.stringify({
        account: account.email,
        ok: false,
        error: error?.message || String(error),
      }, null, 2));
    }
  }
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
