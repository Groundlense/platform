import { Module } from '@nestjs/common';
import { DatabaseModule } from '../database/database.module';
import { SoilDescriptionsService } from './soil-descriptions.service';
import { SoilDescriptionsController } from './soil-descriptions.controller';

@Module({
  imports: [DatabaseModule],
  controllers: [SoilDescriptionsController],
  providers: [SoilDescriptionsService],
  exports: [SoilDescriptionsService],
})
export class SoilDescriptionsModule {}
