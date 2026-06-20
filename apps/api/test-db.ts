import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function main() {
  const users = await prisma.user.findMany({
    include: {
      roles: {
        include: {
          role: true
        }
      },
      organization: true
    }
  });
  console.log('Users in DB:');
  for (const u of users) {
    console.log(`- ${u.email} (${u.firstName} ${u.lastName}):`);
    console.log(`  Org: ${u.organization.name} (${u.organization.type})`);
    console.log(`  Roles: ${u.roles.map(r => r.role.code).join(', ')}`);
  }
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
