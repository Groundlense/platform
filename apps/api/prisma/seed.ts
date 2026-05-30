import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  const roles = [
    {
      code: 'EPC_ADMIN',
      name: 'EPC Admin',
      description: 'Full access to EPC organization',
    },
    {
      code: 'EPC_MANAGER',
      name: 'EPC Manager',
      description: 'Manage EPC projects',
    },
    {
      code: 'EPC_VIEWER',
      name: 'EPC Viewer',
      description: 'Read only access',
    },
    {
      code: 'GEOTECH_ADMIN',
      name: 'Geotech Admin',
      description: 'Full geotech access',
    },
    {
      code: 'GEOTECH_MANAGER',
      name: 'Geotech Manager',
      description: 'Manage operations and assignments',
    },
    {
      code: 'GEOTECH_ENGINEER',
      name: 'Geotech Engineer',
      description: 'Review and validate field data',
    },
    {
      code: 'FIELD_WORKER',
      name: 'Field Worker',
      description: 'Field data collection user',
    },
  ];

  const permissions = [
    'PROJECT_CREATE',
    'PROJECT_VIEW',
    'PROJECT_EDIT',

    'WORKER_ASSIGN',

    'BOREHOLE_CREATE',
    'BOREHOLE_VIEW',
    'BOREHOLE_EDIT',

    'SPT_CREATE',
    'SPT_VIEW',

    'MEDIA_UPLOAD',

    'REPORT_VIEW',
  ];

  for (const role of roles) {
    await prisma.role.upsert({
      where: { code: role.code },
      update: {},
      create: role,
    });
  }

  for (const permissionCode of permissions) {
    await prisma.permission.upsert({
      where: { code: permissionCode },
      update: {},
      create: {
        code: permissionCode,
        module: permissionCode.split('_')[0],
        action: permissionCode.split('_').slice(1).join('_'),
      },
    });
  }

  console.log('✅ Roles seeded');
  console.log('✅ Permissions seeded');
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });