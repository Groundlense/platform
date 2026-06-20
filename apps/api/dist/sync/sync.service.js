"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var SyncService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.SyncService = void 0;
const common_1 = require("@nestjs/common");
const fs = __importStar(require("fs"));
const path = __importStar(require("path"));
const crypto = __importStar(require("crypto"));
const database_service_1 = require("../database/database.service");
const integrity_service_1 = require("../common/integrity/integrity.service");
const client_1 = require("@prisma/client");
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
const LOCAL_INTERVAL_ID = /^interval-(.+)-(\d+)$/;
let SyncService = SyncService_1 = class SyncService {
    db;
    integrity;
    logger = new common_1.Logger(SyncService_1.name);
    constructor(db, integrity) {
        this.db = db;
        this.integrity = integrity;
    }
    async syncQueue(dto, user) {
        const results = [];
        for (const op of dto.operations) {
            const device = await this.resolveDevice(op.deviceId, user.id);
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
            let status = client_1.SyncStatus.SYNCED;
            let error;
            try {
                await this.applyOperation(op, user.id);
            }
            catch (err) {
                status = client_1.SyncStatus.FAILED;
                error = err?.message ?? 'Unknown error';
                this.logger.warn(`Sync operation ${op.operationId} (${op.entityType}/${op.operationType}) failed: ${error}`);
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
                    syncedAt: status === client_1.SyncStatus.SYNCED ? new Date() : null,
                },
            });
            results.push({
                operationId: op.operationId,
                status,
                ...(error ? { error } : {}),
            });
        }
        const processedCount = results.filter((r) => r.status === client_1.SyncStatus.SYNCED).length;
        return {
            success: results.every((r) => r.status === client_1.SyncStatus.SYNCED),
            processedCount,
            results,
        };
    }
    async resolveDevice(deviceUuid, userId) {
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
    async applyOperation(op, userId) {
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
    async applyBoringUpdate(op) {
        if (op.operationType !== 'UPDATE') {
            throw new Error(`Unsupported operation ${op.operationType} for BORING`);
        }
        const payload = op.payloadJson ?? {};
        const borehole = await this.db.borehole.findUnique({
            where: { id: op.entityId },
        });
        if (!borehole) {
            throw new common_1.NotFoundException(`Borehole ${op.entityId} not found`);
        }
        const data = {};
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
        if (Object.keys(data).length === 0) {
            return;
        }
        await this.db.borehole.update({
            where: { id: borehole.id },
            data,
        });
    }
    async applyIntervalUpsert(op, userId) {
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
            throw new common_1.NotFoundException(`Borehole ${boreholeId} not found`);
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
        const existing = await this.db.boreholeInterval.findUnique({
            where: {
                boreholeId_intervalNo: {
                    boreholeId,
                    intervalNo,
                },
            },
        });
        const recordedByUserId = existing?.recordedByUserId ?? userId;
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
            },
            create: {
                boreholeId,
                intervalNo,
                ...fields,
                recordedByUserId,
            },
        });
        await this.integrity.rehashChain(boreholeId, intervalNo);
    }
    async applySampleCreate(op, userId) {
        if (op.operationType !== 'CREATE') {
            throw new Error(`Unsupported operation ${op.operationType} for SAMPLE`);
        }
        const payload = op.payloadJson ?? {};
        const interval = await this.resolveInterval(payload.intervalId);
        const sampleType = SAMPLE_TYPES.includes(payload.sampleType)
            ? payload.sampleType
            : 'DISTURBED';
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
    async resolveInterval(intervalId) {
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
            throw new common_1.NotFoundException(`Interval ${intervalId} not found`);
        }
        return interval;
    }
    async applyWaterLevelCreate(op, userId) {
        if (op.operationType !== 'CREATE') {
            throw new Error(`Unsupported operation ${op.operationType} for WATER_LEVEL`);
        }
        const payload = op.payloadJson ?? {};
        if (!payload.boreholeId || payload.depth == null) {
            throw new Error('WATER_LEVEL payload missing boreholeId/depth');
        }
        const borehole = await this.db.borehole.findUnique({
            where: { id: payload.boreholeId },
        });
        if (!borehole) {
            throw new common_1.NotFoundException(`Borehole ${payload.boreholeId} not found`);
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
        await this.db.waterTableObservation.update({
            where: { id: observation.id },
            data: {
                sha256Hash: this.integrity.computeRecordHash(null, this.integrity.hashWaterTablePayload(observation)),
            },
        });
    }
    async getConflicts(deviceId, user) {
        const device = await this.db.device.findFirst({
            where: {
                OR: [{ id: deviceId }, { deviceUuid: deviceId }],
            },
        });
        if (!device) {
            throw new common_1.NotFoundException('Device not registered');
        }
        if (device.userId !== user.id && !user.roles?.includes('SUPER_ADMIN')) {
            throw new common_1.ForbiddenException('Device belongs to another user');
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
    async applyPhotoCreate(op, userId) {
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
};
exports.SyncService = SyncService;
exports.SyncService = SyncService = SyncService_1 = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [database_service_1.DatabaseService,
        integrity_service_1.IntegrityService])
], SyncService);
//# sourceMappingURL=sync.service.js.map