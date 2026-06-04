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
}