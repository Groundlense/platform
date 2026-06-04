import { Module } from '@nestjs/common';

import { ActivityLogsService } from './activity-logs.service';

import { DatabaseModule } from '../database/database.module';

@Module({
  imports: [DatabaseModule],

  providers: [ActivityLogsService],

  exports: [ActivityLogsService],
})
export class ActivityLogsModule {}