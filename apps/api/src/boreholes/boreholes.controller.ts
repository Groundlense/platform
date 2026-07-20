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
import { existsSync } from 'fs';
import { join } from 'path';
import archiver from 'archiver';

import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { PermissionsGuard } from '../auth/guards/permissions.guard';
import { Permissions } from '../auth/decorators/permissions.decorator';

import { CurrentUser } from '../auth/decorators/current-user.decorator';

import { BoreholesService } from './boreholes.service';

import { CreateBoreholeDto } from './dto/create-borehole.dto';

import { UpdateIntervalDto } from './dto/update-interval.dto';

import { CreateSampleDto } from './dto/create-sample.dto';

import { AssignBoreholeDto } from './dto/assign-borehole.dto';
import { BulkAssignTeamDto } from './dto/bulk-assign-team.dto';
import { UpdateBoreholeLocationDto } from './dto/update-borehole-location.dto';
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

  // Batched: every borehole's full report data (intervals, samples incl.
  // labResult, media, water table) in one call — avoids N+M separate
  // per-borehole/per-sample requests on every project-page load and every
  // 30s background poll.
  @Permissions('REPORT_VIEW')
  @Get('projects/:projectId/report-data')
  getProjectReportData(
    @Param('projectId')
    projectId: string,

    @CurrentUser()
    user: any,
  ) {
    return this.boreholesService.getProjectReportData(projectId, user);
  }

  // Boreholes assigned to the calling worker via team membership.
  // NOTE: registered before 'boreholes/:id' so "assigned" isn't matched as an id.
  @Permissions('BOREHOLE_VIEW')
  @Get('boreholes/assigned')
  findAssigned(
    @Query('projectId')
    projectId: string | undefined,

    @CurrentUser()
    user: any,
  ) {
    return this.boreholesService.findAssignedToUser(user, projectId);
  }

  // Whether project setup (boreholes/members/assignments) is frozen because
  // fieldwork has started — drives the web Setup tab lock banner.
  @Permissions('PROJECT_VIEW')
  @Get('projects/:projectId/setup-status')
  getSetupStatus(
    @Param('projectId')
    projectId: string,

    @CurrentUser()
    user: any,
  ) {
    return this.boreholesService.getSetupStatus(projectId, user);
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

  // Corrects a borehole's coordinates in place — for data uploaded before
  // the UTM zone picker existed (see UpdateBoreholeLocationDto).
  @Permissions('WORKER_ASSIGN')
  @Patch('boreholes/:id/location')
  updateLocation(
    @Param('id')
    boreholeId: string,

    @Body()
    dto: UpdateBoreholeLocationDto,

    @CurrentUser()
    user: any,
  ) {
    return this.boreholesService.updateLocation(boreholeId, user, dto);
  }

  // Batched: assigns a team to many boreholes in one call — replaces what
  // used to be one PATCH request per borehole (sequential, in-order) for
  // bulk team assignment.
  @Permissions('WORKER_ASSIGN')
  @Patch('projects/:projectId/boreholes/bulk-assign-team')
  bulkAssignTeam(
    @Param('projectId')
    projectId: string,

    @Body()
    dto: BulkAssignTeamDto,

    @CurrentUser()
    user: any,
  ) {
    return this.boreholesService.bulkAssignTeam(projectId, user, dto);
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

  @Permissions('REPORT_VIEW')
  @Get('projects/:projectId/photos/zip')
  async downloadProjectPhotosZip(
    @Param('projectId')
    projectId: string,

    @CurrentUser()
    user: any,

    @Res()
    res: Response,
  ) {
    const media = await this.boreholesService.listProjectMediaForZip(
      projectId,
      user,
    );

    res.setHeader('Content-Type', 'application/zip');
    res.setHeader(
      'Content-Disposition',
      `attachment; filename="site-photos-${projectId}.zip"`,
    );

    const archive = archiver('zip', { zlib: { level: 6 } });
    archive.on('error', (err) => res.destroy(err));
    archive.pipe(res);

    // Files missing on disk (e.g. an ephemeral storage wipe) are skipped,
    // not fatal — the rest of the archive still downloads.
    for (const m of media) {
      if (!m.mimeType?.startsWith('image/')) continue;
      const absolutePath = join(process.cwd(), 'uploads', m.filePath);
      if (!existsSync(absolutePath)) continue;
      archive.file(absolutePath, {
        name: `${m.boreholeCode}/${m.fileName || m.id}`,
      });
    }

    await archive.finalize();
  }
}
