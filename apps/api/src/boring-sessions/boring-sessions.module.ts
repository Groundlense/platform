import { Module } from '@nestjs/common';
import { DatabaseModule } from '../database/database.module';
import { BoringSessionsService } from './boring-sessions.service';
import { BoringSessionsController } from './boring-sessions.controller';

@Module({
  imports: [DatabaseModule],
  controllers: [BoringSessionsController],
  providers: [BoringSessionsService],
  exports: [BoringSessionsService],
})
export class BoringSessionsModule {}
