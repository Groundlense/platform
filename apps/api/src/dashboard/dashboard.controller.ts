import { Controller, Get, UseGuards } from '@nestjs/common';

import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';

import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

import { DashboardService } from './dashboard.service';

import { Param } from '@nestjs/common';
import { Request } from '@nestjs/common';

import { CurrentUser } from '../auth/decorators/current-user.decorator';

@ApiTags('Dashboard')
@ApiBearerAuth()
@Controller('dashboard')
@UseGuards(JwtAuthGuard)
export class DashboardController {
  constructor(private readonly dashboardService: DashboardService) {}

  @Get('summary')
  getSummary(@CurrentUser() user: any) {
    return this.dashboardService.getSummary(user);
  }

  @Get('projects/:projectId')
  getProjectDashboard(
    @Param('projectId')
    projectId: string,

    @CurrentUser() user: any,
  ) {
    return this.dashboardService.getProjectDashboard(projectId, user);
  }

  @Get('me')
  getMe(@Request() req) {
    return req.user;
  }
}
