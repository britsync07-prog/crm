import { PrismaBetterSqlite3 } from "@prisma/adapter-better-sqlite3";
import { PrismaClient } from "@prisma/client";

const adapter = new PrismaBetterSqlite3({ url: "file:prisma/dev.db" });
const db = new PrismaClient({ adapter });

console.log("Keys on db object:", Object.keys(db).filter(k => !k.startsWith('$')));
db.$disconnect();
