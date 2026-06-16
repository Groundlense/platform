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
import { NablLabsService } from './nabl-labs.service';
import { CreateNablLabDto } from './dto/create-nabl-lab.dto';
import { CreateLabResultDto } from './dto/create-lab-result.dto';
import { DispatchSampleDto } from './dto/dispatch-sample.dto';

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

  // Groundlense-admin action per the RBAC spec ("Approve NABL labs").
  @Permissions('NABL_LAB_APPROVE')
  @Patch('nabl-labs/:labId/approve')
  approveLab(@Param('labId') labId: string) {
    return this.nablLabsService.approveLab(labId);
  }

  @Permissions('BOREHOLE_EDIT')
  @Post('samples/:sampleId/lab-results')
  submitResult(
    @Param('sampleId') sampleId: string,
    @Body() dto: CreateLabResultDto,
  ) {
    return this.nablLabsService.submitResult(sampleId, dto);
  }

  // Dispatch a collected sample to a GL-approved NABL lab.
  @Permissions('BOREHOLE_EDIT')
  @Patch('samples/:sampleId/dispatch')
  dispatchSample(
    @Param('sampleId') sampleId: string,
    @Body() dto: DispatchSampleDto,
    @CurrentUser() user: any,
  ) {
    return this.nablLabsService.dispatchSample(sampleId, dto, user);
  }

  @Permissions('BOREHOLE_VIEW')
  @Get('samples/:sampleId/lab-results')
  getResult(@Param('sampleId') sampleId: string) {
    return this.nablLabsService.getResult(sampleId);
  }
}
