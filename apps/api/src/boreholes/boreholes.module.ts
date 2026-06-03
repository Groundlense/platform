import { Module } from '@nestjs/common';
import { BoreholesService } from './boreholes.service';
import { BoreholesController } from './boreholes.controller';

@Module({
  providers: [BoreholesService],
  controllers: [BoreholesController]
})
export class BoreholesModule {}
