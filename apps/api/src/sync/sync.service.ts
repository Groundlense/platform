import {
  ForbiddenException,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import * as fs from 'fs';
import * as path from 'path';
import * as crypto from 'crypto';
import { DatabaseService } from '../database/database.service';
import { IntegrityService } from '../common/integrity/integrity.service';
import {
  CreateSyncOperationsDto,
  SyncOperationItemDto,
} from './dto/create-sync-operations.dto';
import { SyncStatus } from '@prisma/client';

const BOREHOLE_STATUSES = [
  'PLANNED',
  'IN_PROGRESS',
  'COMPLETED',
  'ABANDONED',
  'TERMINATED',
  'SUSPENDED',
];

const SAMPLE_TYPES = ['DISTURBED', 'UNDISTURBED'];

const WATER_READING_TYPES = [
  'DRILLING_LEVEL',
  'REST_LEVEL',
  'STABILIZED_LEVEL',
];

// Mobile generates local interval IDs as `interval-<boreholeUuid>-<intervalNo>`.
const LOCAL_INTERVAL_ID = /^interval-(.+)-(\d+)$/;

@Injectable()
export class SyncService {
  private readonly logger = new Logger(SyncService.name);

  constructor(
    private readonly db: DatabaseService,
    private readonly integrity: IntegrityService,
  ) {}

  async syncQueue(dto: CreateSyncOperationsDto, user: any) {
    const results: Array<{
      operationId: string;
      status: SyncStatus;
      error?: string;
    }> = [];

    for (const op of dto.operations) {
      const device = await this.resolveDevice(op.deviceId, user.id);

      // Idempotency: an operation already recorded for this device is skipped.
      const existing = await this.db.syncOperation.findFirst({
        where: {
          deviceId: device.id,
          operationId: op.operationId,
        },
      });

      if (existing) {
        results.push({
          operationId: op.operationId,
          status: existing.status,
        });
        continue;
      }

      let status: SyncStatus = SyncStatus.SYNCED;
      let error: string | undefined;

      try {
        await this.applyOperation(op, user.id);
      } catch (err: any) {
        status = SyncStatus.FAILED;
        error = err?.message ?? 'Unknown error';
        this.logger.warn(
          `Sync operation ${op.operationId} (${op.entityType}/${op.operationType}) failed: ${error}`,
        );
      }

      await this.db.syncOperation.create({
        data: {
          deviceId: device.id,
          operationId: op.operationId,
          entityType: op.entityType,
          entityId: op.entityId,
          operationType: op.operationType,
          payloadJson: op.payloadJson,
          boringSessionId: op.boringSessionId || null,
          status,
          syncedAt: status === SyncStatus.SYNCED ? new Date() : null,
        },
      });

      results.push({
        operationId: op.operationId,
        status,
        ...(error ? { error } : {}),
      });
    }

    const processedCount = results.filter(
      (r) => r.status === SyncStatus.SYNCED,
    ).length;

    return {
      success: results.every((r) => r.status === SyncStatus.SYNCED),
      processedCount,
      results,
    };
  }

  // Devices register bound to the authenticated caller — never to an
  // arbitrary user, and never with fabricated metadata.
  private async resolveDevice(deviceUuid: string, userId: string) {
    const device = await this.db.device.findUnique({
      where: { deviceUuid },
    });

    if (device) {
      return this.db.device.update({
        where: { id: device.id },
        data: {
          lastSeenAt: new Date(),
          lastSyncAt: new Date(),
        },
      });
    }

    return this.db.device.create({
      data: {
        userId,
        deviceUuid,
        platform: 'ANDROID',
        lastSeenAt: new Date(),
        lastSyncAt: new Date(),
      },
    });
  }

  private async applyOperation(op: SyncOperationItemDto, userId: string) {
    switch (op.entityType) {
      case 'BORING':
        return this.applyBoringUpdate(op);
      case 'SPT_RECORD':
        return this.applyIntervalUpsert(op, userId);
      case 'SAMPLE':
        return this.applySampleCreate(op, userId);
      case 'WATER_LEVEL':
        return this.applyWaterLevelCreate(op, userId);
      case 'PHOTO':
        return this.applyPhotoCreate(op, userId);
      default:
        throw new Error(`Unsupported entity type ${op.entityType}`);
    }
  }

  private async applyBoringUpdate(op: SyncOperationItemDto) {
    if (op.operationType !== 'UPDATE') {
      throw new Error(`Unsupported operation ${op.operationType} for BORING`);
    }

    const payload = op.payloadJson ?? {};

    const borehole = await this.db.borehole.findUnique({
      where: { id: op.entityId },
    });

    if (!borehole) {
      throw new NotFoundException(`Borehole ${op.entityId} not found`);
    }

    const data: Record<string, any> = {};

    if (payload.status && BOREHOLE_STATUSES.includes(payload.status)) {
      data.status = payload.status;

      if (payload.status === 'COMPLETED') {
        data.completedAt = payload.completedAt
          ? new Date(payload.completedAt)
          : new Date();
      }
    }

    if (payload.finalDepth != null) {
      data.finalDepth = payload.finalDepth;
    }

    if (payload.rigType) {
      data.rigType = payload.rigType;
    }

    if (payload.startedAt) {
      const startedAt = new Date(payload.startedAt);
      if (!Number.isNaN(startedAt.getTime())) {
        data.startedAt = startedAt;
      }
    }

    // Worker's real GPS at boring start — enables planned-vs-actual
    // deviation on the portals. Only accepted as a pair.
    if (
      Number.isFinite(Number(payload.actualLat)) &&
      Number.isFinite(Number(payload.actualLng))
    ) {
      data.actualLat = Number(payload.actualLat);
      data.actualLng = Number(payload.actualLng);
      if (Number.isFinite(Number(payload.actualAccuracyM))) {
        data.actualAccuracyM = Number(payload.actualAccuracyM);
      }
    }

    if (Object.keys(data).length === 0) {
      // Nothing materializable (e.g. review-thread replies until that
      // module exists); the payload stays recorded on the operation row.
      return;
    }

    await this.db.borehole.update({
      where: { id: borehole.id },
      data,
    });
  }

  private async applyIntervalUpsert(op: SyncOperationItemDto, userId: string) {
    const payload = op.payloadJson ?? {};

    const boreholeId = payload.boreholeId;
    const intervalNo = Number(payload.intervalNo);

    if (!boreholeId || !Number.isInteger(intervalNo)) {
      throw new Error('SPT_RECORD payload missing boreholeId/intervalNo');
    }

    const borehole = await this.db.borehole.findUnique({
      where: { id: boreholeId },
    });

    if (!borehole) {
      throw new NotFoundException(`Borehole ${boreholeId} not found`);
    }

    const fields = {
      fromDepth: payload.fromDepth ?? 0,
      toDepth: payload.toDepth ?? 0,
      soilDescription: payload.soilDescription ?? null,
      nValue: payload.nValue ?? payload.nCorrected ?? null,
      remarks: payload.remarks ?? null,
      isCompleted: payload.isCompleted ?? true,
      blow1: payload.blow1 ?? null,
      blow2: payload.blow2 ?? null,
      blow3: payload.blow3 ?? null,
      nCorrected: payload.nCorrected ?? null,
      isRefusal: payload.isRefusal ?? false,
      penetrationMm: payload.penetrationMm ?? null,
      dilatancyApplied: payload.dilatancyApplied ?? false,
      observedAt: payload.observedAt ? new Date(payload.observedAt) : null,
    };

    // Tamper-evidence (spec: SPT records carry sha256_hash chained via
    // prev_hash). The recorder is the authenticated sync caller; a
    // replayed update never overwrites the original field recorder.
    const existing = await this.db.boreholeInterval.findUnique({
      where: {
        boreholeId_intervalNo: {
          boreholeId,
          intervalNo,
        },
      },
    });

    const recordedByUserId = (existing as any)?.recordedByUserId ?? userId;

    await this.db.boreholeInterval.upsert({
      where: {
        boreholeId_intervalNo: {
          boreholeId,
          intervalNo,
        },
      },
      update: {
        ...fields,
        recordedByUserId,
      } as any,
      create: {
        boreholeId,
        intervalNo,
        ...fields,
        recordedByUserId,
      } as any,
    });

    // Hash from the persisted values (Decimal-scale safe) and cascade to
    // any later intervals already on the server, so out-of-order replays
    // re-link prevHash -> sha256Hash for the whole tail of the chain.
    await this.integrity.rehashChain(boreholeId, intervalNo);
  }

  private async applySampleCreate(op: SyncOperationItemDto, userId: string) {
    if (op.operationType !== 'CREATE') {
      throw new Error(`Unsupported operation ${op.operationType} for SAMPLE`);
    }

    const payload = op.payloadJson ?? {};

    const interval = await this.resolveInterval(payload.intervalId);

    const sampleType = SAMPLE_TYPES.includes(payload.sampleType)
      ? payload.sampleType
      : 'DISTURBED';

    // Idempotency: same sample number on the same interval is a replay.
    const existing = await this.db.sample.findFirst({
      where: {
        intervalId: interval.id,
        sampleNumber: payload.sampleNumber,
      },
    });

    if (existing) {
      return;
    }

    await this.db.sample.create({
      data: {
        intervalId: interval.id,
        sampleNumber: payload.sampleNumber,
        sampleType,
        sampleDepth: payload.sampleDepth ?? 0,
        sampleCondition: payload.condition ?? null,
        collectedByUserId: userId,
        collectedAt: payload.createdAt
          ? new Date(payload.createdAt)
          : new Date(),
      },
    });
  }

  private async resolveInterval(intervalId: string) {
    if (!intervalId) {
      throw new Error('SAMPLE payload missing intervalId');
    }

    const localMatch = intervalId.match(LOCAL_INTERVAL_ID);

    const interval = localMatch
      ? await this.db.boreholeInterval.findUnique({
          where: {
            boreholeId_intervalNo: {
              boreholeId: localMatch[1],
              intervalNo: Number(localMatch[2]),
            },
          },
        })
      : await this.db.boreholeInterval.findUnique({
          where: { id: intervalId },
        });

    if (!interval) {
      throw new NotFoundException(`Interval ${intervalId} not found`);
    }

    return interval;
  }

  private async applyWaterLevelCreate(
    op: SyncOperationItemDto,
    userId: string,
  ) {
    if (op.operationType !== 'CREATE') {
      throw new Error(
        `Unsupported operation ${op.operationType} for WATER_LEVEL`,
      );
    }

    const payload = op.payloadJson ?? {};

    if (!payload.boreholeId || payload.depth == null) {
      throw new Error('WATER_LEVEL payload missing boreholeId/depth');
    }

    const borehole = await this.db.borehole.findUnique({
      where: { id: payload.boreholeId },
    });

    if (!borehole) {
      throw new NotFoundException(`Borehole ${payload.boreholeId} not found`);
    }

    const observation = await this.db.waterTableObservation.create({
      data: {
        boreholeId: payload.boreholeId,
        depth: payload.depth,
        observedAt: payload.observedAt
          ? new Date(payload.observedAt)
          : new Date(),
        remarks: payload.remarks ?? null,
        readingType: WATER_READING_TYPES.includes(payload.readingType)
          ? payload.readingType
          : null,
        createdByUserId: userId,
      },
    });

    // WaterTableObservation has sha256Hash only (no prev chain) — a
    // standalone tamper hash computed from the persisted values.
    await this.db.waterTableObservation.update({
      where: { id: observation.id },
      data: {
        sha256Hash: this.integrity.computeRecordHash(
          null,
          this.integrity.hashWaterTablePayload(observation as any),
        ),
      },
    });
  }

  async getConflicts(deviceId: string, user: any) {
    const device = await this.db.device.findFirst({
      where: {
        OR: [{ id: deviceId }, { deviceUuid: deviceId }],
      },
    });

    if (!device) {
      throw new NotFoundException('Device not registered');
    }

    // A user may only read conflicts for their own devices.
    if (device.userId !== user.id && !user.roles?.includes('SUPER_ADMIN')) {
      throw new ForbiddenException('Device belongs to another user');
    }

    return this.db.conflictLog.findMany({
      where: { deviceId: device.id },
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

  private async applyPhotoCreate(op: SyncOperationItemDto, userId: string) {
    if (op.operationType !== 'CREATE') {
      throw new Error(`Unsupported operation ${op.operationType} for PHOTO`);
    }

    const payload = op.payloadJson ?? {};
    const intervalId = payload.intervalId;
    if (!intervalId) {
      throw new Error('PHOTO payload missing intervalId');
    }

    const interval = await this.resolveInterval(intervalId);

    let filePath = payload.filePath || '';
    if (payload.base64Data) {
      const buffer = Buffer.from(payload.base64Data, 'base64');
      const filename = `${Date.now()}-${crypto.randomBytes(6).toString('hex')}.jpg`;
      const uploadsDir = path.join(process.cwd(), 'uploads');
      const absolutePath = path.join(uploadsDir, filename);

      if (!fs.existsSync(uploadsDir)) {
        fs.mkdirSync(uploadsDir, { recursive: true });
      }

      fs.writeFileSync(absolutePath, buffer);
      filePath = filename;
    }

    const existing = await this.db.media.findFirst({
      where: {
        intervalId: interval.id,
        fileName: payload.fileName,
      },
    });

    if (existing) {
      return;
    }

    await this.db.media.create({
      data: {
        intervalId: interval.id,
        fileName: payload.fileName || 'photo.jpg',
        filePath,
        mimeType: payload.mimeType || 'image/jpeg',
        mediaType: 'PHOTO',
        uploadedByUserId: userId,
      },
    });
  }
}
