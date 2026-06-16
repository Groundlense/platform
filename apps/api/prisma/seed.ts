import { PrismaClient } from '@prisma/client';
import * as bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function main() {
  
  const groundlenseOrg = await prisma.organization.upsert({
    where: { id: 'groundlense-seed' },
    update: {},
    create: {
      id: 'groundlense-seed',
      name: 'Groundlense Platform',
      type: 'GEOTECH_CONTRACTOR',
    },
  });

  const epcOrg = await prisma.organization.upsert({
    where: { id: 'epc-seed' },
    update: {},
    create: {
      id: 'epc-seed',
      name: 'XYZ Infra Pvt Ltd',
      type: 'EPC_CONTRACTOR',
    },
  });

  const geotechOrg = await prisma.organization.upsert({
    where: { id: 'geotech-seed' },
    update: {},
    create: {
      id: 'geotech-seed',
      name: 'ABC Geotech Pvt Ltd',
      type: 'GEOTECH_CONTRACTOR',
    },
  });

  const passwordHash = await bcrypt.hash('Password@123', 10);
  const pinHash = await bcrypt.hash('1234', 10);

  // Super Admin
  const superadmin = await prisma.user.upsert({
    where: { email: 'superadmin@groundlense.com' },
    update: {},
    create: {
      organizationId: groundlenseOrg.id,
      firstName: 'Groundlense',
      lastName: 'Superadmin',
      email: 'superadmin@groundlense.com',
      passwordHash,
    },
  });

  // EPC Users
  const epcAdmin = await prisma.user.upsert({
    where: { email: 'admin@xyzinfra.com' },
    update: {},
    create: {
      organizationId: epcOrg.id,
      firstName: 'EPC',
      lastName: 'Admin',
      email: 'admin@xyzinfra.com',
      passwordHash,
    },
  });

  const epcPM = await prisma.user.upsert({
    where: { email: 'pm@xyzinfra.com' },
    update: {},
    create: {
      organizationId: epcOrg.id,
      firstName: 'EPC',
      lastName: 'PM',
      email: 'pm@xyzinfra.com',
      passwordHash,
    },
  });

  const epcViewer = await prisma.user.upsert({
    where: { email: 'viewer@xyzinfra.com' },
    update: {},
    create: {
      organizationId: epcOrg.id,
      firstName: 'EPC',
      lastName: 'Viewer',
      email: 'viewer@xyzinfra.com',
      passwordHash,
    },
  });

  // Geotech Users
  const geotechAdmin = await prisma.user.upsert({
    where: { email: 'admin@abcgeotech.com' },
    update: {},
    create: {
      organizationId: geotechOrg.id,
      firstName: 'Geo',
      lastName: 'Admin',
      email: 'admin@abcgeotech.com',
      passwordHash,
    },
  });

  const geotechPM = await prisma.user.upsert({
    where: { email: 'pm@abcgeotech.com' },
    update: {},
    create: {
      organizationId: geotechOrg.id,
      firstName: 'Geo',
      lastName: 'PM',
      email: 'pm@abcgeotech.com',
      passwordHash,
    },
  });

  const geotechEngineer = await prisma.user.upsert({
    where: { email: 'engineer@abcgeotech.com' },
    update: {},
    create: {
      organizationId: geotechOrg.id,
      firstName: 'Geo',
      lastName: 'Engineer',
      email: 'engineer@abcgeotech.com',
      passwordHash,
    },
  });

  const worker = await prisma.user.upsert({
    where: { employeeCode: 'GL-W-0001' },
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

    'USER_VIEW',
    'USER_MANAGE',

    'NABL_LAB_APPROVE',

    'REVIEW_CREATE',
    'REVIEW_VIEW',

    // Org profile management; ORG_KYC_VERIFY is assigned to no role —
    // the SUPER_ADMIN bypass in PermissionsGuard covers it.
    'ORG_MANAGE',
    'ORG_KYC_VERIFY',
  ];

  for (const role of roles) {
    await prisma.role.upsert({
      where: { code: role.code },
      update: {},
      create: role,
    });
  }

  // Helper to assign a role to a user
  async function assignRole(userEmailOrCode: string, roleCode: string, isEmployeeCode = false) {
    const user = await prisma.user.findFirst({
      where: isEmployeeCode ? { employeeCode: userEmailOrCode } : { email: userEmailOrCode },
    });
    const role = await prisma.role.findUnique({
      where: { code: roleCode },
    });
    if (user && role) {
      await prisma.userRole.upsert({
        where: {
          userId_roleId: {
            userId: user.id,
            roleId: role.id,
          },
        },
        update: {},
        create: {
          userId: user.id,
          roleId: role.id,
        },
      });
    }
  }

  // Assign roles
  await assignRole('superadmin@groundlense.com', 'SUPER_ADMIN');
  
  await assignRole('admin@xyzinfra.com', 'EPC_ADMIN');
  await assignRole('pm@xyzinfra.com', 'EPC_MANAGER');
  await assignRole('viewer@xyzinfra.com', 'EPC_VIEWER');

  await assignRole('admin@abcgeotech.com', 'GEOTECH_ADMIN');
  await assignRole('pm@abcgeotech.com', 'GEOTECH_MANAGER');
  await assignRole('engineer@abcgeotech.com', 'GEOTECH_ENGINEER');
  await assignRole('GL-W-0001', 'FIELD_WORKER', true);
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
  async function assignPermission(
    roleCode: string,
    permissionCode: string,
  ) {
    const role = await prisma.role.findUnique({
      where: { code: roleCode },
    });

    const permission = await prisma.permission.findUnique({
      where: { code: permissionCode },
    });

    if (role && permission) {
      await prisma.rolePermission.upsert({
        where: {
          roleId_permissionId: {
            roleId: role.id,
            permissionId: permission.id,
          },
        },
        update: {},
        create: {
          roleId: role.id,
          permissionId: permission.id,
        },
      });
    }
  }

  // 1. GEOTECH_ADMIN permissions
  const geotechAdminPermissions = [
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
    'USER_VIEW',
    'USER_MANAGE',
    'REVIEW_CREATE',
    'REVIEW_VIEW',
    'ORG_MANAGE',
  ];
  for (const perm of geotechAdminPermissions) {
    await assignPermission('GEOTECH_ADMIN', perm);
  }

  // 2. GEOTECH_MANAGER permissions
  const geotechManagerPermissions = [
    'USER_VIEW',
    'PROJECT_VIEW',
    'WORKER_ASSIGN',
    'BOREHOLE_CREATE',
    'BOREHOLE_VIEW',
    'BOREHOLE_EDIT',
    'SPT_CREATE',
    'SPT_VIEW',
    'MEDIA_UPLOAD',
    'REPORT_VIEW',
    'REVIEW_CREATE',
    'REVIEW_VIEW',
  ];
  for (const perm of geotechManagerPermissions) {
    await assignPermission('GEOTECH_MANAGER', perm);
  }

  // 3. GEOTECH_ENGINEER permissions
  const geotechEngineerPermissions = [
    'PROJECT_VIEW',
    'BOREHOLE_VIEW',
    'BOREHOLE_EDIT',
    'SPT_VIEW',
    'REPORT_VIEW',
    'REVIEW_CREATE',
    'REVIEW_VIEW',
  ];
  for (const perm of geotechEngineerPermissions) {
    await assignPermission('GEOTECH_ENGINEER', perm);
  }

  // 4. FIELD_WORKER permissions
  const fieldWorkerPermissions = [
    'PROJECT_VIEW',
    'BOREHOLE_VIEW',
    'SPT_CREATE',
    'SPT_VIEW',
    'MEDIA_UPLOAD',
  ];
  for (const perm of fieldWorkerPermissions) {
    await assignPermission('FIELD_WORKER', perm);
  }

  // 5. EPC_ADMIN permissions
  const epcAdminPermissions = [
    'PROJECT_CREATE',
    'PROJECT_VIEW',
    'PROJECT_EDIT',
    'BOREHOLE_VIEW',
    'SPT_VIEW',
    'REPORT_VIEW',
    'USER_VIEW',
    'USER_MANAGE',
    'REVIEW_VIEW',
    'ORG_MANAGE',
  ];
  for (const perm of epcAdminPermissions) {
    await assignPermission('EPC_ADMIN', perm);
  }

  // 6. EPC_MANAGER permissions
  const epcManagerPermissions = [
    'PROJECT_VIEW',
    'BOREHOLE_VIEW',
    'SPT_VIEW',
    'REPORT_VIEW',
    'REVIEW_VIEW',
  ];
  for (const perm of epcManagerPermissions) {
    await assignPermission('EPC_MANAGER', perm);
  }

  // 7. EPC_VIEWER permissions
  const epcViewerPermissions = [
    'PROJECT_VIEW',
    'BOREHOLE_VIEW',
    'SPT_VIEW',
    'REPORT_VIEW',
    'REVIEW_VIEW',
  ];
  for (const perm of epcViewerPermissions) {
    await assignPermission('EPC_VIEWER', perm);
  }
  // Update any existing users without an employeeCode
  const usersToUpdate = await prisma.user.findMany({
    where: { OR: [{ employeeCode: null }, { employeeCode: '' }] },
    include: { organization: true },
  });

  for (const user of usersToUpdate) {
    let prefix = 'GL-USER';
    if (user.organization.type === 'EPC_CONTRACTOR') {
      prefix = 'GL-CON';
    } else if (user.organization.type === 'GEOTECH_CONTRACTOR') {
      prefix = 'GL-GEO';
    } else if (user.organization.type === 'CLIENT') {
      prefix = 'GL-CL';
    } else if (user.organization.type === 'NABL_LAB') {
      prefix = 'GL-LAB';
    } else if (user.organization.type === 'IE_FIRM') {
      prefix = 'GL-ENG';
    } else if (user.organization.type === 'STRUCTURAL_CONSULTANT') {
      prefix = 'GL-STR';
    }

    let isUnique = false;
    let employeeCode = '';
    while (!isUnique) {
      const randNum = Math.floor(1000 + Math.random() * 9000);
      employeeCode = `${prefix}-${randNum}`;
      const existing = await prisma.user.findUnique({
        where: { employeeCode },
      });
      if (!existing) {
        isUnique = true;
      }
    }

    await prisma.user.update({
      where: { id: user.id },
      data: { employeeCode },
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