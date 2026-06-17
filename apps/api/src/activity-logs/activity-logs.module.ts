import { Module } from '@nestjs/common';

import { ActivityLogsService } from './activity-logs.service';

import { DatabaseModule } from '../database/database.module';
import { ActivityLogsController } from './activity-logs.controller';

@Module({
  imports: [DatabaseModule],

  providers: [ActivityLogsService],

  exports: [ActivityLogsService],

  controllers: [ActivityLogsController],
})
export class ActivityLogsModule {}
