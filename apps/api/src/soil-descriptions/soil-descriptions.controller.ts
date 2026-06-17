import { Body, Controller, Get, Param, Post, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { PermissionsGuard } from '../auth/guards/permissions.guard';
import { Permissions } from '../auth/decorators/permissions.decorator';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { SoilDescriptionsService } from './soil-descriptions.service';
import { CreateSoilDescriptionDto } from './dto/create-soil-description.dto';

@ApiTags('Soil Descriptions')
@ApiBearerAuth()
@Controller('intervals')
@UseGuards(JwtAuthGuard, PermissionsGuard)
export class SoilDescriptionsController {
  constructor(
    private readonly soilDescriptionsService: SoilDescriptionsService,
  ) {}

  @Permissions('BOREHOLE_EDIT')
  @Post(':intervalId/soil-description')
  upsert(
    @Param('intervalId') intervalId: string,
    @CurrentUser() user: any,
    @Body() dto: CreateSoilDescriptionDto,
  ) {
    return this.soilDescriptionsService.upsert(intervalId, user.id, dto);
  }

  @Permissions('BOREHOLE_VIEW')
  @Get(':intervalId/soil-description')
  findByInterval(@Param('intervalId') intervalId: string) {
    return this.soilDescriptionsService.findByInterval(intervalId);
  }
}
