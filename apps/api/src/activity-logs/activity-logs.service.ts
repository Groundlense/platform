import { Injectable } from '@nestjs/common';

import { DatabaseService } from '../database/database.service';

import { ProjectAccessService } from '../common/access/project-access.service';

@Injectable()
export class ActivityLogsService {
  constructor(
    private readonly db: DatabaseService,
    private readonly access: ProjectAccessService,
  ) {}

  // Audit logs are scoped to the caller's organization unless SUPER_ADMIN.
  private orgScopeWhere(actor: any) {
    return this.access.isSuperAdmin(actor)
      ? {}
      : {
          user: {
            organizationId: actor.organizationId,
          },
        };
  }

  async log(
    userId: string,
    action: string,
    entityType: string,
    entityId: string,
    metadata?: any,
    // Optional audit detail per the Data Ownership Rule: edits never
    // overwrite history silently — old/new snapshots and the IS-code
    // justification are preserved on the audit row.
    options?: {
      oldValue?: any;
      newValue?: any;
      actorCompanyId?: string;
      isCodeReason?: string;
    },
  ) {
    return this.db.activityLog.create({
      data: {
        userId,

        action,

        entityType,

        entityId,

        metadata,

        oldValue: options?.oldValue,

        newValue: options?.newValue,

        actorCompanyId: options?.actorCompanyId,

        isCodeReason: options?.isCodeReason,
      },
    });
  }
  async findAll(actor: any) {
  return this.db.activityLog.findMany({
    where: this.orgScopeWhere(actor),
    include: {
      user: {
        select: {
          id: true,
          firstName: true,
          lastName: true,
          email: true,
          employeeCode: true,
        },
      },
    },
    orderBy: {
      createdAt: 'desc',
    },
  });
}

async findRecent(actor: any) {
  return this.db.activityLog.findMany({
    take: 20,

    where: this.orgScopeWhere(actor),

    include: {
      user: {
        select: {
          firstName: true,
          lastName: true,
        },
      },
    },

    orderBy: {
      createdAt: 'desc',
    },
  });
}

async findByUser(
  userId: string,
  actor: any,
) {
  return this.db.activityLog.findMany({
    where: {
      userId,
      ...this.orgScopeWhere(actor),
    },

    orderBy: {
      createdAt: 'desc',
    },
  });
}
}
