import {
  Controller,
  Get,
  UseGuards,
} from '@nestjs/common';

import {
  ApiBearerAuth,
  ApiTags,
} from '@nestjs/swagger';

import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

import { DashboardService } from './dashboard.service';

import { Param } from '@nestjs/common';

@ApiTags('Dashboard')
@ApiBearerAuth()
@Controller('dashboard')
@UseGuards(JwtAuthGuard)
export class DashboardController {
  constructor(
    private readonly dashboardService: DashboardService,
  ) {}

  @Get('summary')
  getSummary() {
    return this.dashboardService.getSummary();
  }

  @Get('projects/:projectId')
getProjectDashboard(
  @Param('projectId')
  projectId: string,
) {
  return this.dashboardService.getProjectDashboard(
    projectId,
  );
}
}