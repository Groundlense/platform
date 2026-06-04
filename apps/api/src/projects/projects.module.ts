import { Module } from '@nestjs/common';
import { ProjectsController } from './projects.controller';
import { ProjectsService } from './projects.service';
import { ActivityLogsModule } from '../activity-logs/activity-logs.module';
import { DatabaseModule } from '../database/database.module';
@Module({
  controllers: [ProjectsController],
  providers: [ProjectsService],
  imports: [
        DatabaseModule,
    ActivityLogsModule,
  ]
})
export class ProjectsModule {}
