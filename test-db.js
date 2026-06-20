import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function main() {
  const projects = await prisma.project.findMany({
    include: {
      epcOrganization: true,
      geotechOrganization: true,
      members: true,
    }
  });
  console.log('Projects in DB:');
  console.dir(projects, { depth: null });
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
