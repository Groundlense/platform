import { Injectable } from '@nestjs/common';

import { DatabaseService } from '../database/database.service';

@Injectable()
export class ActivityLogsService {
  constructor(
    private readonly db: DatabaseService,
  ) {}

  async log(
    userId: string,
    action: string,
    entityType: string,
    entityId: string,
    metadata?: any,
  ) {
    return this.db.activityLog.create({
      data: {
        userId,

        action,

        entityType,

        entityId,

        metadata,
      },
    });
  }
  async findAll() {
  return this.db.activityLog.findMany({
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

async findRecent() {
  return this.db.activityLog.findMany({
    take: 20,

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
) {
  return this.db.activityLog.findMany({
    where: {
      userId,
    },

    orderBy: {
      createdAt: 'desc',
    },
  });
}
}