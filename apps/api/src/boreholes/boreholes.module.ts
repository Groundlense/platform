import { Module } from '@nestjs/common';
import { BoreholesService } from './boreholes.service';
import { BoreholesController } from './boreholes.controller';
import { ActivityLogsModule } from '../activity-logs/activity-logs.module';

@Module({
  imports: [ActivityLogsModule],
  providers: [BoreholesService],
  controllers: [BoreholesController],
})
export class BoreholesModule {}
