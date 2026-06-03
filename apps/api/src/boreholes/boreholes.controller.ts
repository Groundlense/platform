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
}