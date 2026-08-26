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
  isCloudinaryConfigured,
  uploadToCloudinary,
} from '../media/cloudinary';
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

      // Idempotency: an operation already recorded for this device is skipped
      // — but ONLY if it succeeded. A FAILED op must be re-applied on retry:
      // transient failures (DB hiccup, out-of-order arrival, borehole not yet
      // created) would otherwise poison the operation forever, with the
      // mobile resending it every round and the field data never landing.
      const existing = await this.db.syncOperation.findFirst({
        where: {
          deviceId: device.id,
          operationId: op.operationId,
        },
      });

      if (existing && existing.status === SyncStatus.SYNCED) {
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

      // Retry of a previously FAILED op: update the existing audit row
      // instead of creating a duplicate.
      if (existing) {
        try {
          await this.db.syncOperation.update({
            where: { id: existing.id },
            data: {
              status,
              syncedAt: status === SyncStatus.SYNCED ? new Date() : null,
            },
          });
        } catch (auditErr: any) {
          this.logger.warn(
            `Sync audit update failed for ${op.operationId}: ${auditErr?.message}`,
          );
        }
        results.push({
          operationId: op.operationId,
          status,
          ...(error ? { error } : {}),
        });
        continue;
      }

      // Offline devices attach locally generated session ids (`sess-…`)
      // that don't exist server-side. Writing one into the FK column blows
      // up the whole batch with a 500 — and because the audit row was never
      // created, the mobile retries the same poisoned op forever (a
      // permanent sync deadlock). Store only session ids that exist.
      let boringSessionId: string | null = op.boringSessionId || null;
      if (boringSessionId) {
        const sessionExists = await this.db.boringSession.findUnique({
          where: { id: boringSessionId },
          select: { id: true },
        });
        if (!sessionExists) boringSessionId = null;
      }

      try {
        await this.db.syncOperation.create({
          data: {
            deviceId: device.id,
            operationId: op.operationId,
            entityType: op.entityType,
            entityId: op.entityId,
            operationType: op.operationType,
            payloadJson: op.payloadJson,
            boringSessionId,
            status,
            syncedAt: status === SyncStatus.SYNCED ? new Date() : null,
          },
        });
      } catch (auditErr: any) {
        // The audit row must never take down the batch — the domain write
        // above already happened (or was recorded FAILED honestly).
        this.logger.warn(
          `Sync audit row failed for ${op.operationId}: ${auditErr?.message}`,
        );
      }

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
      case 'SESSION':
        return this.applySessionEnd(op, userId);
      default:
        throw new Error(`Unsupported entity type ${op.entityType}`);
    }
  }

  /**
   * Session end synced from the queue — the offline path of
   * BoringSessionsService#end. Sessions started offline have local ids
   * (`sess-…`) that don't exist server-side, so resolution falls back to
   * the latest still-open session on the borehole; if none exists at all,
   * the session is recreated from the payload so the record (start/end
   * depth, timing, reason) is never lost.
   */
  private async applySessionEnd(op: SyncOperationItemDto, userId: string) {
    const payload = op.payloadJson ?? {};
    const boreholeId = payload.boreholeId;
    if (!boreholeId) {
      throw new Error('SESSION payload missing boreholeId');
    }

    const borehole = await this.db.borehole.findUnique({
      where: { id: boreholeId },
      select: { id: true },
    });
    if (!borehole) {
      throw new NotFoundException(`Borehole ${boreholeId} not found`);
    }

    const endData = {
      endDepth: payload.endDepth ?? 0,
      status: payload.status ? String(payload.status) : 'TERMINATED',
      terminationReason: payload.terminationReason
        ? String(payload.terminationReason)
        : null,
      endedAt: payload.endedAt ? new Date(payload.endedAt) : new Date(),
    };

    // 1. Exact server id from an online-started session.
    const byId =
      op.entityId && !op.entityId.startsWith('sess-')
        ? await this.db.boringSession.findUnique({
            where: { id: op.entityId },
            select: { id: true },
          })
        : null;
    if (byId) {
      await this.db.boringSession.update({
        where: { id: byId.id },
        data: endData,
      });
      return;
    }

    // 2. Latest still-open session on this borehole.
    const open = await this.db.boringSession.findFirst({
      where: { boreholeId, endedAt: null },
      orderBy: { startedAt: 'desc' },
      select: { id: true },
    });
    if (open) {
      await this.db.boringSession.update({
        where: { id: open.id },
        data: endData,
      });
      return;
    }

    // 3. Session never reached the server (started offline) — recreate it
    // closed, preserving the worker's recorded timing and depths.
    const startedAt = payload.startedAt ? new Date(payload.startedAt) : null;
    await this.db.boringSession.create({
      data: {
        boreholeId,
        workerId: userId,
        startDepth: payload.startDepth ?? 0,
        ...endData,
        startedAt:
          startedAt && !Number.isNaN(startedAt.getTime())
            ? startedAt
            : endData.endedAt,
      },
    });
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

    // Queued operations can arrive out of order — an old pause syncing after
    // a deeper closure — and a shallower value would then overwrite ground
    // already proven. Depth only ever deepens.
    const finalDepth = Number(payload.finalDepth);
    if (payload.finalDepth != null && Number.isFinite(finalDepth)) {
      const known =
        borehole.finalDepth != null ? Number(borehole.finalDepth) : null;
      if (known === null || finalDepth > known) {
        data.finalDepth = finalDepth;
      }
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

    // Rig setup + field context — every field the worker entered is
    // persisted; these used to be silently dropped while the operation
    // still reported SYNCED.
    const intDiameter = parseInt(payload.diameter, 10);
    if (Number.isInteger(intDiameter) && intDiameter > 0) {
      data.diameter = intDiameter;
    }
    if (payload.drillingFluid) data.drillingFluid = String(payload.drillingFluid);
    if (payload.hammerType) data.hammerType = String(payload.hammerType);
    if (payload.drillerId) data.drillerId = String(payload.drillerId);
    if (payload.weather) data.weather = String(payload.weather);
    if (payload.terminationReason) {
      data.terminationReason = String(payload.terminationReason);
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

    await this.advanceOpenSessionDepth(boreholeId, Number(fields.toDepth));

    // Hash from the persisted values (Decimal-scale safe) and cascade to
    // any later intervals already on the server, so out-of-order replays
    // re-link prevHash -> sha256Hash for the whole tail of the chain.
    await this.integrity.rehashChain(boreholeId, intervalNo);
  }

  /**
   * An open session's endDepth is seeded with its startDepth and was only
   * rewritten when the worker terminated, so a session interrupted mid-boring
   * reported ground shallower than what had actually been drilled — and a
   * resume then restarted from that stale depth. Carry it forward as intervals
   * arrive. Only ever deepens, so a replayed or out-of-order interval cannot
   * walk the session back up the hole.
   */
  private async advanceOpenSessionDepth(boreholeId: string, toDepth: number) {
    if (!Number.isFinite(toDepth) || toDepth <= 0) {
      return;
    }

    const open = await this.db.boringSession.findFirst({
      where: { boreholeId, endedAt: null },
      orderBy: { startedAt: 'desc' },
      select: { id: true, endDepth: true },
    });
    if (!open || Number(open.endDepth) >= toDepth) {
      return;
    }

    await this.db.boringSession.update({
      where: { id: open.id },
      data: { endDepth: toDepth },
    });
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

      // Same permanent-storage rule as the multipart upload path: disk on
      // Render is ephemeral, so move the photo to Cloudinary when possible.
      if (isCloudinaryConfigured()) {
        try {
          filePath = await uploadToCloudinary(absolutePath, {
            folder: 'groundlense',
            fileName: payload.fileName || filename,
            mimeType: payload.mimeType || 'image/jpeg',
          });
          fs.unlinkSync(absolutePath);
        } catch {
          // Keep the local copy — never lose the photo over a storage error.
        }
      }
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
