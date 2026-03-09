const { PrismaClient } = require("@prisma/client");
const Database = require("better-sqlite3");
const { PrismaBetterSqlite3 } = require("@prisma/adapter-better-sqlite3");

try {
  const db = new Database("prisma/dev.db");
  const adapter = new PrismaBetterSqlite3(db);
  const prisma = new PrismaClient({ adapter });
  console.log("Instantiated with adapter successfully.");
  
  prisma.user.findFirst().then(user => {
    console.log("Queried successfully via adapter");
  }).catch(e => {
    console.error("Query Error:", e);
  });
} catch(e) {
  console.error("Init Error:", e);
}
