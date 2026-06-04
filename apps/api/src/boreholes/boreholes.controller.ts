import {
  Body,
  Controller,
  Get,
  Param,
  Patch,
  Post,
  UseGuards,
} from '@nestjs/common';

import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { PermissionsGuard } from '../auth/guards/permissions.guard';
import { Permissions } from '../auth/decorators/permissions.decorator';

import { CurrentUser } from '../auth/decorators/current-user.decorator';

import { BoreholesService } from './boreholes.service';

import { CreateBoreholeDto } from './dto/create-borehole.dto';

import { UpdateIntervalDto } from './dto/update-interval.dto';

import { CreateSampleDto } from './dto/create-sample.dto';

import { AssignBoreholeDto } from './dto/assign-borehole.dto';
import {
  ApiBearerAuth,
  ApiTags,
} from '@nestjs/swagger';

import { UpdateBoreholeStatusDto, } from './dto/update-borehole-status.dto';
import { CreateWaterTableDto } from './dto/create-water-table.dto';
@ApiTags('Boreholes')
@ApiBearerAuth()
@Controller()
@UseGuards(JwtAuthGuard, PermissionsGuard)
export class BoreholesController {
  constructor(
    private readonly boreholesService: BoreholesService,
  ) {}

  @Permissions('BOREHOLE_CREATE')
  @Post(
    'projects/:projectId/boreholes',
  )
  create(
    @Param('projectId')
    projectId: string,

    @Body()
    dto: CreateBoreholeDto,

    @CurrentUser()
    user: any,
  ) {
    return this.boreholesService.create(
      projectId,
      user.id,
      dto,
    );
  }

  @Permissions('BOREHOLE_VIEW')
  @Get(
    'projects/:projectId/boreholes',
  )
  findByProject(
    @Param('projectId')
    projectId: string,
  ) {
    return this.boreholesService.findByProject(
      projectId,
    );
  }

  @Permissions('BOREHOLE_VIEW')
  @Get('boreholes/:id')
  findOne(
    @Param('id')
    id: string,
  ) {
    return this.boreholesService.findOne(
      id,
    );
  }

  @Permissions('BOREHOLE_VIEW')
  @Get('boreholes/:id/intervals')
  getIntervals(
    @Param('id')
    boreholeId: string,
  ) {
    return this.boreholesService.getIntervals(
      boreholeId,
    );
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
    return this.boreholesService.updateInterval(
      id,
      user.id,
      dto,
    );
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
    return this.boreholesService.createSample(
      intervalId,
      user.id,
      dto,
    );
  }

  @Permissions('BOREHOLE_VIEW')
  @Get('intervals/:intervalId/samples')
  getSamples(
    @Param('intervalId')
    intervalId: string,
  ) {
    return this.boreholesService.getSamples(
      intervalId,
    );
  }

  @Permissions('WORKER_ASSIGN')
  @Patch(
    'boreholes/:id/assignment',
  )
  assign(
    @Param('id')
    boreholeId: string,

    @Body()
    dto: AssignBoreholeDto,

    @CurrentUser()
    user: any,
  ) {
    return this.boreholesService.assign(
      boreholeId,
      user.id,
      dto,
    );
  }
  @Permissions('BOREHOLE_EDIT')
  @Patch(
    'boreholes/:id/status',
  )
  updateStatus(
    @Param('id')
    boreholeId: string,

    @Body()
    dto: UpdateBoreholeStatusDto,

    @CurrentUser()
    user: any,
  ) {
    return this.boreholesService.updateStatus(
      boreholeId,
      dto.status,
      user.id,
    );
  }
  @Permissions('REPORT_VIEW')
  @Get(
    'boreholes/:id/report-data',
  )
  getReportData(
    @Param('id')
    boreholeId: string,
  ) {
    return this.boreholesService.getReportData(
      boreholeId,
    );
  }
  @Permissions('BOREHOLE_EDIT')
  @Post(
    'boreholes/:id/water-table',
  )
  createWaterTableObservation(
    @Param('id')
    boreholeId: string,

    @Body()
    dto: CreateWaterTableDto,

    @CurrentUser()
    user: any,
  ) {
    return this.boreholesService
      .createWaterTableObservation(
        boreholeId,
        dto,
        user.id,
      );
  }
  @Permissions('BOREHOLE_VIEW')
  @Get(
    'boreholes/:id/water-table',
  )
  getWaterTableObservations(
    @Param('id')
    boreholeId: string,
  ) {
    return this.boreholesService
      .getWaterTableObservations(
        boreholeId,
      );
  }
}
