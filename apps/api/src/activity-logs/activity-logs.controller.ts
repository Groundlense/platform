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

import { CurrentUser } from '../auth/decorators/current-user.decorator';

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
  findAll(
    @CurrentUser() user: any,
  ) {
    return this.activityLogsService.findAll(
      user,
    );
  }

  @Get('recent')
  findRecent(
    @CurrentUser() user: any,
  ) {
    return this.activityLogsService.findRecent(
      user,
    );
  }

  @Get('user/:userId')
  findByUser(
    @Param('userId')
    userId: string,

    @CurrentUser() user: any,
  ) {
    return this.activityLogsService.findByUser(
      userId,
      user,
    );
  }
}