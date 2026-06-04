import { Module } from '@nestjs/common';

import { SitesController } from './sites.controller';
import { SitesService } from './sites.service';

import { DatabaseModule } from '../database/database.module';

@Module({
  imports: [DatabaseModule],

  controllers: [SitesController],

  providers: [SitesService],
})
export class SitesModule {}