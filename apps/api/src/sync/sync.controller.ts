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
import { SyncService } from './sync.service';
import { CreateSyncOperationsDto } from './dto/create-sync-operations.dto';

@ApiTags('Sync Queue')
@ApiBearerAuth()
@Controller('sync')
@UseGuards(JwtAuthGuard, PermissionsGuard)
export class SyncController {
  constructor(private readonly syncService: SyncService) {}

  @Permissions('BOREHOLE_EDIT')
  @Post('operations')
  syncQueue(@Body() dto: CreateSyncOperationsDto) {
    return this.syncService.syncQueue(dto);
  }

  @Permissions('BOREHOLE_VIEW')
  @Get('conflicts/:deviceId')
  getConflicts(@Param('deviceId') deviceId: string) {
    return this.syncService.getConflicts(deviceId);
  }
}
