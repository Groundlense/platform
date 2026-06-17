import { Body, Controller, Get, Param, Post, UseGuards } from '@nestjs/common';

import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';

import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

import { SitesService } from './sites.service';

import { CreateSiteDto } from './dto/create-site.dto';

@ApiTags('Sites')
@ApiBearerAuth()
@Controller()
@UseGuards(JwtAuthGuard)
export class SitesController {
  constructor(private readonly sitesService: SitesService) {}

  @Post('projects/:projectId/sites')
  create(
    @Param('projectId')
    projectId: string,

    @Body()
    dto: CreateSiteDto,
  ) {
    return this.sitesService.create(projectId, dto);
  }

  @Get('projects/:projectId/sites')
  findByProject(
    @Param('projectId')
    projectId: string,
  ) {
    return this.sitesService.findByProject(projectId);
  }

  @Get('sites/:id')
  findOne(
    @Param('id')
    id: string,
  ) {
    return this.sitesService.findOne(id);
  }
  @Get('sites/:siteId/dashboard')
  getDashboard(
    @Param('siteId')
    siteId: string,
  ) {
    return this.sitesService.getDashboard(siteId);
  }
}
