import {
  Controller,
  Get,
  Param,
  UseGuards,
} from '@nestjs/common';

import {
  ApiBearerAuth,
  ApiTags,
} from '@nestjs/swagger';

import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

import { ActivityLogsService } from './activity-logs.service';

@ApiTags('Activity Logs')
@ApiBearerAuth()
@Controller('activity-logs')
@UseGuards(JwtAuthGuard)
export class ActivityLogsController {
  constructor(
    private readonly activityLogsService: ActivityLogsService,
  ) {}

  @Get()
  findAll() {
    return this.activityLogsService.findAll();
  }

  @Get('recent')
  findRecent() {
    return this.activityLogsService.findRecent();
  }

  @Get('user/:userId')
  findByUser(
    @Param('userId')
    userId: string,
  ) {
    return this.activityLogsService.findByUser(
      userId,
    );
  }
}