import { PrismaClient } from '@prisma/client';
import * as bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function main() {
  
  const epcOrg = await prisma.organization.upsert({
  where: {
    id: 'epc-seed',
  },
  update: {},
  create: {
    id: 'epc-seed',
    name: 'XYZ Infra Pvt Ltd',
    type: 'EPC_CONTRACTOR',
  },
});

const geotechOrg = await prisma.organization.upsert({
  where: {
    id: 'geotech-seed',
  },
  update: {},
  create: {
    id: 'geotech-seed',
    name: 'ABC Geotech Pvt Ltd',
    type: 'GEOTECH_CONTRACTOR',
  },
});

const passwordHash = await bcrypt.hash(
  'Password@123',
  10,
);

const pinHash = await bcrypt.hash(
  '1234',
  10,
);

const epcAdmin = await prisma.user.upsert({
  where: {
    email: 'admin@xyzinfra.com',
  },
  update: {},
  create: {
    organizationId: epcOrg.id,

    firstName: 'EPC',
    lastName: 'Admin',

    email: 'admin@xyzinfra.com',

    passwordHash,
  },
});

const geotechAdmin = await prisma.user.upsert({
  where: {
    email: 'admin@abcgeotech.com',
  },
  update: {},
  create: {
    organizationId: geotechOrg.id,

    firstName: 'Geo',
    lastName: 'Admin',

    email: 'admin@abcgeotech.com',

    passwordHash,
  },
});

const worker = await prisma.user.upsert({
  where: {
    employeeCode: 'GL-W-0001',
  },
  update: {},
  create: {
    organizationId: geotechOrg.id,

    employeeCode: 'GL-W-0001',

    firstName: 'Field',
    lastName: 'Worker',

    pinHash,
    passwordHash: pinHash,
  },
});

  const roles = [
    {
      code: 'SUPER_ADMIN',
      name: 'Super Admin',
      description: 'Full access to all organizations',
    },
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

  const fieldWorkerRole =
  await prisma.role.findUnique({
    where: {
      code: 'FIELD_WORKER',
    },
  });

  await prisma.userRole.upsert({
  where: {
    userId_roleId: {
      userId: worker.id,
      roleId: fieldWorkerRole!.id,
    },
  },
  update: {},
  create: {
    userId: worker.id,
    roleId: fieldWorkerRole!.id,
  },
});

const superAdminRole =
  await prisma.role.findUnique({
    where: {
      code: 'SUPER_ADMIN',
    },
  });

await prisma.userRole.upsert({
  where: {
    userId_roleId: {
      userId: geotechAdmin.id,
      roleId: superAdminRole!.id,
    },
  },
  update: {},
  create: {
    userId: geotechAdmin.id,
    roleId: superAdminRole!.id,
  },
});
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
  const epcAdminRole =
  await prisma.role.findUnique({
    where: {
      code: 'EPC_ADMIN',
    },
  });

const projectCreatePermission =
  await prisma.permission.findUnique({
    where: {
      code: 'PROJECT_CREATE',
    },
  });

await prisma.rolePermission.upsert({
  where: {
    roleId_permissionId: {
      roleId: epcAdminRole!.id,
      permissionId:
        projectCreatePermission!.id,
    },
  },
  update: {},
  create: {
    roleId: epcAdminRole!.id,
    permissionId:
      projectCreatePermission!.id,
  },
});
async function assignPermission(
  roleCode: string,
  permissionCode: string,
) {
  const role =
    await prisma.role.findUnique({
      where: {
        code: roleCode,
      },
    });

  const permission =
    await prisma.permission.findUnique({
      where: {
        code: permissionCode,
      },
    });

  await prisma.rolePermission.upsert({
    where: {
      roleId_permissionId: {
        roleId: role!.id,
        permissionId:
          permission!.id,
      },
    },
    update: {},
    create: {
      roleId: role!.id,
      permissionId:
        permission!.id,
    },
  });
}
await assignPermission(
  'EPC_ADMIN',
  'PROJECT_CREATE',
);

await assignPermission(
  'EPC_ADMIN',
  'PROJECT_VIEW',
);

await assignPermission(
  'EPC_ADMIN',
  'PROJECT_EDIT',
);

await assignPermission(
  'FIELD_WORKER',
  'MEDIA_UPLOAD',
);
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