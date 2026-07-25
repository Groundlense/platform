import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('Wiping database public schema...');
  await prisma.$executeRawUnsafe('DROP SCHEMA public CASCADE;');
  await prisma.$executeRawUnsafe('CREATE SCHEMA public;');
  console.log('✅ Public schema successfully dropped and recreated!');
}

main()
  .catch(console.error)
  .finally(async () => {
    await prisma.$disconnect();
  });
