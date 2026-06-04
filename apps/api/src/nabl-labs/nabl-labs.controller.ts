import {
  Body,
  Controller,
  Get,
  Param,
  Post,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { PermissionsGuard } from '../auth/guards/permissions.guard';
import { Permissions } from '../auth/decorators/permissions.decorator';
import { NablLabsService } from './nabl-labs.service';
import { CreateNablLabDto } from './dto/create-nabl-lab.dto';
import { CreateLabResultDto } from './dto/create-lab-result.dto';

@ApiTags('NABL Labs')
@ApiBearerAuth()
@Controller()
@UseGuards(JwtAuthGuard, PermissionsGuard)
export class NablLabsController {
  constructor(private readonly nablLabsService: NablLabsService) {}

  @Permissions('PROJECT_EDIT')
  @Post('nabl-labs')
  registerLab(@Body() dto: CreateNablLabDto) {
    return this.nablLabsService.registerLab(dto);
  }

  @Permissions('PROJECT_VIEW')
  @Get('nabl-labs')
  findAllLabs() {
    return this.nablLabsService.findAllLabs();
  }

  @Permissions('BOREHOLE_EDIT')
  @Post('samples/:sampleId/lab-results')
  submitResult(
    @Param('sampleId') sampleId: string,
    @Body() dto: CreateLabResultDto,
  ) {
    return this.nablLabsService.submitResult(sampleId, dto);
  }

  @Permissions('BOREHOLE_VIEW')
  @Get('samples/:sampleId/lab-results')
  getResult(@Param('sampleId') sampleId: string) {
    return this.nablLabsService.getResult(sampleId);
  }
}
