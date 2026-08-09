import { PrismaClient } from "@prisma/client";
import { PrismaBetterSqlite3 } from "@prisma/adapter-better-sqlite3";
import { fetchEmailBody, fetchRecentEmails } from "../src/lib/imap";

const adapter = new PrismaBetterSqlite3({ url: process.env.DATABASE_URL || "file:prisma/dev.db" });
const prisma = new PrismaClient({ adapter });

async function main() {
  const account = await prisma.emailAccount.findFirst({
    where: { email: "syedislam@ascentraconsulting.co.uk" },
  });
  if (!account) throw new Error("Saved mailbox not found");

  const emails = await fetchRecentEmails(account, "INBOX");
  console.log(JSON.stringify({
    count: emails.length,
    emails: emails.map((email: any) => ({ id: email.id, subject: email.subject })).slice(0, 5),
  }, null, 2));

  if (emails[0]) {
    const body = await fetchEmailBody(account, "INBOX", emails[0].id);
    console.log(JSON.stringify({
      bodyOk: Boolean(body),
      id: body?.id,
      subject: body?.subject,
      from: body?.from,
      textPreview: body?.text?.slice(0, 120),
    }, null, 2));
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
