import {
  Body,
  Controller,
  Get,
  Param,
  Patch,
  Post,
  Query,
  Res,
  UseGuards,
} from '@nestjs/common';
import type { Response } from 'express';

import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { PermissionsGuard } from '../auth/guards/permissions.guard';
import { Permissions } from '../auth/decorators/permissions.decorator';

import { CurrentUser } from '../auth/decorators/current-user.decorator';

import { BoreholesService } from './boreholes.service';

import { CreateBoreholeDto } from './dto/create-borehole.dto';

import { UpdateIntervalDto } from './dto/update-interval.dto';

import { CreateSampleDto } from './dto/create-sample.dto';

import { AssignBoreholeDto } from './dto/assign-borehole.dto';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';

import { UpdateBoreholeStatusDto } from './dto/update-borehole-status.dto';
import { CreateWaterTableDto } from './dto/create-water-table.dto';
import {
  ExportBoreholeQueryDto,
  ExportProjectQueryDto,
} from './dto/export-query.dto';
@ApiTags('Boreholes')
@ApiBearerAuth()
@Controller()
@UseGuards(JwtAuthGuard, PermissionsGuard)
export class BoreholesController {
  constructor(private readonly boreholesService: BoreholesService) {}

  @Permissions('BOREHOLE_CREATE')
  @Post('projects/:projectId/boreholes')
  create(
    @Param('projectId')
    projectId: string,

    @Body()
    dto: CreateBoreholeDto,

    @CurrentUser()
    user: any,
  ) {
    return this.boreholesService.create(projectId, user, dto);
  }

  @Permissions('BOREHOLE_VIEW')
  @Get('projects/:projectId/boreholes')
  findByProject(
    @Param('projectId')
    projectId: string,

    @CurrentUser()
    user: any,
  ) {
    return this.boreholesService.findByProject(projectId, user);
  }

  @Permissions('BOREHOLE_VIEW')
  @Get('boreholes/:id')
  findOne(
    @Param('id')
    id: string,

    @CurrentUser()
    user: any,
  ) {
    return this.boreholesService.findOne(id, user);
  }

  @Permissions('BOREHOLE_VIEW')
  @Get('boreholes/:id/intervals')
  getIntervals(
    @Param('id')
    boreholeId: string,

    @CurrentUser()
    user: any,
  ) {
    return this.boreholesService.getIntervals(boreholeId, user);
  }

  @Permissions('BOREHOLE_EDIT')
  @Patch('intervals/:id')
  updateInterval(
    @Param('id')
    id: string,

    @Body()
    dto: UpdateIntervalDto,

    @CurrentUser()
    user: any,
  ) {
    return this.boreholesService.updateInterval(id, user, dto);
  }

  @Permissions('BOREHOLE_EDIT')
  @Post('intervals/:intervalId/samples')
  createSample(
    @Param('intervalId')
    intervalId: string,

    @Body()
    dto: CreateSampleDto,

    @CurrentUser()
    user: any,
  ) {
    return this.boreholesService.createSample(intervalId, user, dto);
  }

  @Permissions('BOREHOLE_VIEW')
  @Get('intervals/:intervalId/samples')
  getSamples(
    @Param('intervalId')
    intervalId: string,

    @CurrentUser()
    user: any,
  ) {
    return this.boreholesService.getSamples(intervalId, user);
  }

  @Permissions('WORKER_ASSIGN')
  @Patch('boreholes/:id/assignment')
  assign(
    @Param('id')
    boreholeId: string,

    @Body()
    dto: AssignBoreholeDto,

    @CurrentUser()
    user: any,
  ) {
    return this.boreholesService.assign(boreholeId, user, dto);
  }
  @Permissions('BOREHOLE_EDIT')
  @Patch('boreholes/:id/status')
  updateStatus(
    @Param('id')
    boreholeId: string,

    @Body()
    dto: UpdateBoreholeStatusDto,

    @CurrentUser()
    user: any,
  ) {
    return this.boreholesService.updateStatus(boreholeId, dto.status, user);
  }
  @Permissions('REPORT_VIEW')
  @Get('boreholes/:id/report-data')
  getReportData(
    @Param('id')
    boreholeId: string,

    @CurrentUser()
    user: any,
  ) {
    return this.boreholesService.getReportData(boreholeId, user);
  }
  @Permissions('BOREHOLE_EDIT')
  @Post('boreholes/:id/water-table')
  createWaterTableObservation(
    @Param('id')
    boreholeId: string,

    @Body()
    dto: CreateWaterTableDto,

    @CurrentUser()
    user: any,
  ) {
    return this.boreholesService.createWaterTableObservation(
      boreholeId,
      dto,
      user,
    );
  }
  @Permissions('BOREHOLE_VIEW')
  @Get('boreholes/:id/water-table')
  getWaterTableObservations(
    @Param('id')
    boreholeId: string,

    @CurrentUser()
    user: any,
  ) {
    return this.boreholesService.getWaterTableObservations(boreholeId, user);
  }

  @Permissions('REPORT_VIEW')
  @Get('boreholes/:id/integrity')
  getIntegrity(
    @Param('id')
    boreholeId: string,

    @CurrentUser()
    user: any,
  ) {
    return this.boreholesService.getIntegrity(boreholeId, user);
  }

  @Permissions('REPORT_VIEW')
  @Get('boreholes/:id/export')
  async exportBorehole(
    @Param('id')
    boreholeId: string,

    @Query()
    query: ExportBoreholeQueryDto,

    @CurrentUser()
    user: any,

    @Res()
    res: Response,
  ) {
    if (query.format === 'csv') {
      const { fileName, csv } = await this.boreholesService.exportBoreholeCsv(
        boreholeId,
        user,
      );

      res.setHeader('Content-Type', 'text/csv; charset=utf-8');
      res.setHeader(
        'Content-Disposition',
        `attachment; filename="${fileName}"`,
      );

      return res.send(csv);
    }

    const { fileName, payload } = await this.boreholesService.exportBorehole(
      boreholeId,
      user,
    );

    res.setHeader('Content-Type', 'application/json; charset=utf-8');
    res.setHeader('Content-Disposition', `attachment; filename="${fileName}"`);

    return res.send(JSON.stringify(payload, null, 2));
  }

  @Permissions('REPORT_VIEW')
  @Get('projects/:projectId/export')
  exportProject(
    @Param('projectId')
    projectId: string,

    @Query()
    _query: ExportProjectQueryDto,

    @CurrentUser()
    user: any,
  ) {
    return this.boreholesService.exportProject(projectId, user);
  }
}
