const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  console.log('Task fields:', Object.keys(prisma.task.fields || {}));
  // Some versions of prisma don't have .fields exposed this way, 
  // so let's try to just inspect the object
  console.log('Task model keys:', Object.keys(prisma.task));
}

main().catch(console.error).finally(() => prisma.$disconnect());
