import { Module } from '@nestjs/common';
import { DatabaseModule } from '../database/database.module';
import { ActivityLogsModule } from '../activity-logs/activity-logs.module';
import { NablLabsService } from './nabl-labs.service';
import { NablLabsController } from './nabl-labs.controller';

@Module({
  imports: [DatabaseModule, ActivityLogsModule],
  controllers: [NablLabsController],
  providers: [NablLabsService],
  exports: [NablLabsService],
})
export class NablLabsModule {}
