import { Body, Controller, Get, Param, Post, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { PermissionsGuard } from '../auth/guards/permissions.guard';
import { Permissions } from '../auth/decorators/permissions.decorator';
import { SyncService } from './sync.service';
import { CreateSyncOperationsDto } from './dto/create-sync-operations.dto';
import { CurrentUser } from '../auth/decorators/current-user.decorator';

@ApiTags('Sync Queue')
@ApiBearerAuth()
@Controller('sync')
@UseGuards(JwtAuthGuard, PermissionsGuard)
export class SyncController {
  constructor(private readonly syncService: SyncService) {}

  @Permissions('SPT_CREATE')
  @Post('operations')
  syncQueue(@Body() dto: CreateSyncOperationsDto, @CurrentUser() user: any) {
    return this.syncService.syncQueue(dto, user);
  }

  @Permissions('BOREHOLE_VIEW')
  @Get('conflicts/:deviceId')
  getConflicts(@Param('deviceId') deviceId: string, @CurrentUser() user: any) {
    return this.syncService.getConflicts(deviceId, user);
  }
}
