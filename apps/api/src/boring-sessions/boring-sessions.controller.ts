import {
  Body,
  Controller,
  Get,
  Param,
  Patch,
  Post,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { PermissionsGuard } from '../auth/guards/permissions.guard';
import { Permissions } from '../auth/decorators/permissions.decorator';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { BoringSessionsService } from './boring-sessions.service';
import { CreateBoringSessionDto } from './dto/create-boring-session.dto';
import { EndBoringSessionDto } from './dto/end-boring-session.dto';

@ApiTags('Boring Sessions')
@ApiBearerAuth()
@Controller()
@UseGuards(JwtAuthGuard, PermissionsGuard)
export class BoringSessionsController {
  constructor(private readonly boringSessionsService: BoringSessionsService) {}

  @Permissions('BOREHOLE_EDIT')
  @Post('boreholes/:id/sessions')
  start(
    @Param('id') boreholeId: string,
    @CurrentUser() user: any,
    @Body() dto: CreateBoringSessionDto,
  ) {
    return this.boringSessionsService.start(boreholeId, user.id, dto);
  }

  @Permissions('BOREHOLE_EDIT')
  @Patch('sessions/:sessionId/end')
  end(@Param('sessionId') sessionId: string, @Body() dto: EndBoringSessionDto) {
    return this.boringSessionsService.end(sessionId, dto);
  }

  @Permissions('BOREHOLE_VIEW')
  @Get('boreholes/:id/sessions')
  findByBorehole(@Param('id') boreholeId: string) {
    return this.boringSessionsService.findByBorehole(boreholeId);
  }
}
