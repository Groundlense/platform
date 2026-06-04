import {
  Body,
  Controller,
  Get,
  Param,
  Post,
  UseGuards,
} from '@nestjs/common';

import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

import { CurrentUser } from '../auth/decorators/current-user.decorator';

import { BoreholesService } from './boreholes.service';

import { CreateBoreholeDto } from './dto/create-borehole.dto';

import { Patch } from '@nestjs/common';

import { UpdateIntervalDto } from './dto/update-interval.dto';

import { CreateSampleDto } from './dto/create-sample.dto';

import { AssignBoreholeDto } from './dto/assign-borehole.dto';
import {
  ApiBearerAuth,
  ApiTags,
} from '@nestjs/swagger';

@ApiTags('Boreholes')
@ApiBearerAuth()
@Controller()
@UseGuards(JwtAuthGuard)
export class BoreholesController {
  constructor(
    private readonly boreholesService: BoreholesService,
  ) {}

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

  @Get('boreholes/:id')
  findOne(
    @Param('id')
    id: string,
  ) {
    return this.boreholesService.findOne(
      id,
    );
  }

  @Get('boreholes/:id/intervals')
getIntervals(
  @Param('id')
  boreholeId: string,
) {
  return this.boreholesService.getIntervals(
    boreholeId,
  );
}

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

@Get('intervals/:intervalId/samples')
getSamples(
  @Param('intervalId')
  intervalId: string,
) {
  return this.boreholesService.getSamples(
    intervalId,
  );
}

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
}
