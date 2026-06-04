import { Injectable, NotFoundException } from '@nestjs/common';
import { DatabaseService } from '../database/database.service';
import { CreateSyncOperationsDto } from './dto/create-sync-operations.dto';
import { SyncStatus } from '@prisma/client';

@Injectable()
export class SyncService {
  constructor(private readonly db: DatabaseService) {}

  async syncQueue(dto: CreateSyncOperationsDto) {
    const operationsData = dto.operations.map((op) => ({
      deviceId: op.deviceId,
      operationId: op.operationId,
      entityType: op.entityType,
      entityId: op.entityId,
      operationType: op.operationType,
      payloadJson: op.payloadJson,
      boringSessionId: op.boringSessionId || null,
      status: SyncStatus.SYNCED, // Defaulting to Synced for MVP simulation
      syncedAt: new Date(),
    }));

    // Create sync operations
    if (operationsData.length) {
      await this.db.syncOperation.createMany({
        data: operationsData,
      });
    }

    return {
      success: true,
      processedCount: operationsData.length,
    };
  }

  async getConflicts(deviceId: string) {
    // Verify device exists
    const device = await this.db.device.findUnique({
      where: { id: deviceId },
    });
    if (!device) {
      throw new NotFoundException('Device not registered');
    }

    return this.db.conflictLog.findMany({
      where: { deviceId },
      include: {
        resolvedBy: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
          },
        },
      },
      orderBy: {
        localVersion: 'desc',
      },
    });
  }
}
