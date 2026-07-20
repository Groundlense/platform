"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.BoreholesService = void 0;
const common_1 = require("@nestjs/common");
const database_service_1 = require("../database/database.service");
const activity_logs_service_1 = require("../activity-logs/activity-logs.service");
const project_access_service_1 = require("../common/access/project-access.service");
const integrity_service_1 = require("../common/integrity/integrity.service");
const common_2 = require("@nestjs/common");
let BoreholesService = class BoreholesService {
    db;
    activityLogsService;
    access;
    integrity;
    constructor(db, activityLogsService, access, integrity) {
        this.db = db;
        this.activityLogsService = activityLogsService;
        this.access = access;
        this.integrity = integrity;
    }
    async assertSetupUnlocked(projectId, user) {
        if (this.access.isSuperAdmin(user))
            return;
        const started = await this.db.borehole.count({
            where: {
                projectId,
                status: { not: 'PLANNED' },
            },
        });
        if (started > 0) {
            throw new common_2.ForbiddenException('Project setup is locked — fieldwork has already started');
        }
    }
    async getSetupStatus(projectId, user) {
        await this.access.assertProjectAccess(user, projectId);
        const started = await this.db.borehole.count({
            where: {
                projectId,
                status: { not: 'PLANNED' },
            },
        });
        return { locked: started > 0 };
    }
    async findAssignedToUser(user, projectId) {
        return this.db.borehole.findMany({
            where: {
                ...(projectId ? { projectId } : {}),
                team: {
                    members: {
                        some: { userId: user.id },
                    },
                },
            },
            include: {
                team: { select: { id: true, code: true, name: true } },
                project: {
                    select: { id: true, projectCode: true, name: true },
                },
            },
            orderBy: { boreholeCode: 'asc' },
        });
    }
    async findByProject(projectId, user) {
        await this.access.assertProjectAccess(user, projectId);
        return this.db.borehole.findMany({
            where: {
                projectId,
            },
            include: {
                team: true,
            },
            orderBy: {
                boreholeCode: 'asc',
            },
        });
    }
    async findOne(id, user) {
        await this.access.assertBoreholeAccess(user, id);
        return this.db.borehole.findUnique({
            where: {
                id,
            },
            include: {
                project: true,
            },
        });
    }
    async create(projectId, user, dto) {
        await this.access.assertProjectAccess(user, projectId);
        await this.assertSetupUnlocked(projectId, user);
        const borehole = await this.db.borehole.create({
            data: {
                projectId,
                boreholeCode: dto.boreholeCode,
                name: dto.name,
                latitude: dto.latitude,
                longitude: dto.longitude,
                groundLevelRL: dto.groundLevelRL,
                plannedDepth: dto.plannedDepth,
                structureType: dto.structureType,
                chainage: dto.chainage,
                span: dto.span,
                createdByUserId: user.id,
            },
        });
        await this.activityLogsService.log(user.id, 'BOREHOLE_CREATED', 'BOREHOLE', borehole.id);
        return borehole;
    }
    async getIntervals(boreholeId, user) {
        await this.access.assertBoreholeAccess(user, boreholeId);
        return this.db.boreholeInterval.findMany({
            where: {
                boreholeId,
            },
            orderBy: {
                intervalNo: 'asc',
            },
        });
    }
    async updateInterval(id, user, dto) {
        const existing = await this.access.assertIntervalAccess(user, id);
        const interval = await this.db.boreholeInterval.update({
            where: {
                id,
            },
            data: {
                soilDescription: dto.soilDescription,
                nValue: dto.nValue,
                remarks: dto.remarks,
                isCompleted: true,
                recordedByUserId: existing.recordedByUserId ?? user.id,
            },
        });
        await this.integrity.rehashChain(interval.boreholeId, interval.intervalNo);
        await this.activityLogsService.log(user.id, 'INTERVAL_UPDATED', 'INTERVAL', interval.id);
        return this.db.boreholeInterval.findUnique({
            where: { id },
        });
    }
    async createSample(intervalId, user, dto) {
        await this.access.assertIntervalAccess(user, intervalId);
        const sample = await this.db.sample.create({
            data: {
                intervalId,
                sampleNumber: dto.sampleNumber,
                sampleType: dto.sampleType,
                sampleDepth: dto.sampleDepth,
                remarks: dto.remarks,
                collectedByUserId: user.id,
                collectedAt: new Date(),
            },
        });
        await this.activityLogsService.log(user.id, 'SAMPLE_CREATED', 'SAMPLE', sample.id);
        return sample;
    }
    async getSamples(intervalId, user) {
        await this.access.assertIntervalAccess(user, intervalId);
        return this.db.sample.findMany({
            where: {
                intervalId,
            },
            orderBy: {
                createdAt: 'asc',
            },
        });
    }
    async assign(boreholeId, user, dto) {
        const existing = await this.access.assertBoreholeAccess(user, boreholeId);
        if (existing.status !== 'PLANNED' &&
            !this.access.isSuperAdmin(user)) {
            throw new common_2.ForbiddenException('Assignment is locked — fieldwork on this borehole has started');
        }
        const borehole = await this.db.borehole.update({
            where: {
                id: boreholeId,
            },
            data: {
                siteId: dto.siteId,
                teamId: dto.teamId,
                assignedWorkerId: dto.assignedWorkerId,
            },
        });
        await this.activityLogsService.log(user.id, 'BOREHOLE_ASSIGNED', 'BOREHOLE', borehole.id, {
            teamId: dto.teamId,
            siteId: dto.siteId,
        });
        return borehole;
    }
    async updateLocation(boreholeId, user, dto) {
        const existing = await this.access.assertBoreholeAccess(user, boreholeId);
        if (existing.status !== 'PLANNED' && !this.access.isSuperAdmin(user)) {
            throw new common_2.ForbiddenException('Location is locked — fieldwork on this borehole has started');
        }
        const lat = Number(dto.latitude);
        const lng = Number(dto.longitude);
        if (!Number.isFinite(lat) || lat < -90 || lat > 90 ||
            !Number.isFinite(lng) || lng < -180 || lng > 180) {
            throw new common_2.BadRequestException('latitude/longitude must be valid decimal degrees');
        }
        const borehole = await this.db.borehole.update({
            where: { id: boreholeId },
            data: { latitude: dto.latitude, longitude: dto.longitude },
        });
        await this.activityLogsService.log(user.id, 'BOREHOLE_LOCATION_UPDATED', 'BOREHOLE', borehole.id, { latitude: dto.latitude, longitude: dto.longitude });
        return borehole;
    }
    async bulkAssignTeam(projectId, user, dto) {
        await this.access.assertProjectAccess(user, projectId);
        const boreholes = await this.db.borehole.findMany({
            where: { id: { in: dto.boreholeIds }, projectId },
            select: { id: true, status: true, boreholeCode: true },
        });
        const isSuperAdmin = this.access.isSuperAdmin(user);
        const assignable = boreholes.filter((b) => b.status === 'PLANNED' || isSuperAdmin);
        const locked = boreholes.filter((b) => b.status !== 'PLANNED' && !isSuperAdmin);
        const assignableIds = assignable.map((b) => b.id);
        if (assignableIds.length > 0) {
            await this.db.borehole.updateMany({
                where: { id: { in: assignableIds } },
                data: { teamId: dto.teamId },
            });
            await this.activityLogsService.log(user.id, 'BOREHOLE_BULK_ASSIGNED', 'PROJECT', projectId, { boreholeIds: assignableIds, teamId: dto.teamId });
        }
        return {
            assignedIds: assignableIds,
            lockedCodes: locked.map((b) => b.boreholeCode),
        };
    }
    async updateStatus(boreholeId, status, user) {
        const borehole = await this.access.assertBoreholeAccess(user, boreholeId);
        const current = borehole.status;
        const validTransitions = {
            PLANNED: ['IN_PROGRESS', 'ABANDONED'],
            IN_PROGRESS: ['COMPLETED', 'ABANDONED', 'TERMINATED', 'SUSPENDED'],
            TERMINATED: ['IN_PROGRESS', 'COMPLETED', 'ABANDONED'],
            SUSPENDED: ['IN_PROGRESS', 'ABANDONED'],
            COMPLETED: [],
            ABANDONED: [],
        };
        if (!validTransitions[current].includes(status)) {
            throw new common_2.BadRequestException(`Cannot change status from ${current} to ${status}`);
        }
        const updated = await this.db.borehole.update({
            where: {
                id: boreholeId,
            },
            data: {
                status,
            },
        });
        await this.activityLogsService.log(user.id, 'BOREHOLE_STATUS_CHANGED', 'BOREHOLE', boreholeId, {
            from: current,
            to: status,
        });
        return updated;
    }
    async getReportData(boreholeId, user) {
        await this.access.assertBoreholeAccess(user, boreholeId);
        return this.db.borehole.findUnique({
            where: {
                id: boreholeId,
            },
            include: {
                site: true,
                team: true,
                intervals: {
                    include: {
                        samples: true,
                        media: true,
                    },
                },
                waterTableObservations: true,
            },
        });
    }
    async getProjectReportData(projectId, user) {
        await this.access.assertProjectAccess(user, projectId);
        return this.db.borehole.findMany({
            where: { projectId },
            orderBy: { boreholeCode: 'asc' },
            include: {
                site: true,
                team: true,
                intervals: {
                    include: {
                        samples: { include: { labResult: true } },
                        media: true,
                    },
                },
                waterTableObservations: true,
            },
        });
    }
    async createWaterTableObservation(boreholeId, dto, user) {
        await this.access.assertBoreholeAccess(user, boreholeId);
        const created = await this.db.waterTableObservation.create({
            data: {
                boreholeId,
                depth: dto.depth,
                observedAt: new Date(dto.observedAt),
                remarks: dto.remarks,
                createdByUserId: user.id,
            },
        });
        const observation = await this.db.waterTableObservation.update({
            where: { id: created.id },
            data: {
                sha256Hash: this.integrity.computeRecordHash(null, this.integrity.hashWaterTablePayload(created)),
            },
        });
        await this.activityLogsService.log(user.id, 'WATER_TABLE_OBSERVED', 'BOREHOLE', boreholeId, {
            depth: dto.depth,
        });
        return observation;
    }
    async getWaterTableObservations(boreholeId, user) {
        await this.access.assertBoreholeAccess(user, boreholeId);
        return this.db.waterTableObservation.findMany({
            where: {
                boreholeId,
            },
            orderBy: {
                observedAt: 'desc',
            },
        });
    }
    async getIntegrity(boreholeId, user) {
        await this.access.assertBoreholeAccess(user, boreholeId);
        return this.computeIntegritySummary(boreholeId);
    }
    async exportBorehole(boreholeId, user) {
        const borehole = await this.access.assertBoreholeAccess(user, boreholeId);
        const data = await this.db.borehole.findUnique({
            where: { id: boreholeId },
            include: {
                project: {
                    select: {
                        id: true,
                        projectCode: true,
                        name: true,
                    },
                },
                site: true,
                team: true,
                intervals: {
                    orderBy: { intervalNo: 'asc' },
                    include: {
                        samples: true,
                        media: true,
                    },
                },
                waterTableObservations: {
                    orderBy: { observedAt: 'asc' },
                },
            },
        });
        const integrity = await this.computeIntegritySummary(boreholeId);
        return {
            fileName: `${this.safeFileName(borehole.boreholeCode)}-export.json`,
            payload: {
                exportedAt: new Date().toISOString(),
                borehole: data,
                integrity,
            },
        };
    }
    async exportBoreholeCsv(boreholeId, user) {
        const borehole = await this.access.assertBoreholeAccess(user, boreholeId);
        const intervals = await this.db.boreholeInterval.findMany({
            where: { boreholeId },
            orderBy: { intervalNo: 'asc' },
        });
        const header = [
            'intervalNo',
            'fromDepth',
            'toDepth',
            'blow1',
            'blow2',
            'blow3',
            'nValue',
            'nCorrected',
            'isRefusal',
            'soilDescription',
            'observedAt',
            'sha256Hash',
        ];
        const rows = intervals.map((interval) => [
            interval.intervalNo,
            interval.fromDepth,
            interval.toDepth,
            interval.blow1,
            interval.blow2,
            interval.blow3,
            interval.nValue,
            interval.nCorrected,
            interval.isRefusal,
            interval.soilDescription,
            interval.observedAt,
            interval.sha256Hash,
        ]
            .map((cell) => this.csvEscape(cell))
            .join(','));
        return {
            fileName: `${this.safeFileName(borehole.boreholeCode)}-intervals.csv`,
            csv: [header.join(','), ...rows].join('\r\n') + '\r\n',
        };
    }
    async exportProject(projectId, user) {
        await this.access.assertProjectAccess(user, projectId);
        const project = await this.db.project.findUnique({
            where: { id: projectId },
            include: {
                sites: true,
                boreholes: {
                    orderBy: { boreholeCode: 'asc' },
                    include: {
                        intervals: {
                            orderBy: { intervalNo: 'asc' },
                            include: { samples: true },
                        },
                        waterTableObservations: {
                            orderBy: { observedAt: 'asc' },
                        },
                    },
                },
            },
        });
        const integrity = {};
        for (const bh of project?.boreholes ?? []) {
            integrity[bh.boreholeCode] = await this.computeIntegritySummary(bh.id);
        }
        return {
            exportedAt: new Date().toISOString(),
            project,
            integrity,
        };
    }
    async listProjectMediaForZip(projectId, user) {
        await this.access.assertProjectAccess(user, projectId);
        const boreholes = await this.db.borehole.findMany({
            where: { projectId },
            select: {
                boreholeCode: true,
                intervals: {
                    select: {
                        media: {
                            select: { id: true, fileName: true, filePath: true, mimeType: true },
                        },
                    },
                },
            },
            orderBy: { boreholeCode: 'asc' },
        });
        return boreholes.flatMap((bh) => bh.intervals.flatMap((iv) => iv.media.map((m) => ({ ...m, boreholeCode: bh.boreholeCode }))));
    }
    async computeIntegritySummary(boreholeId) {
        const intervals = await this.db.boreholeInterval.findMany({
            where: { boreholeId },
            orderBy: { intervalNo: 'asc' },
        });
        const brokenAt = [];
        let unhashed = 0;
        let prevStored = null;
        for (const interval of intervals) {
            if (!interval.sha256Hash) {
                unhashed += 1;
                prevStored = null;
                continue;
            }
            const expected = this.integrity.computeRecordHash(interval.prevHash ?? null, this.integrity.hashIntervalPayload(interval));
            const contentOk = expected === interval.sha256Hash;
            const linkOk = (interval.prevHash ?? null) === prevStored;
            if (!contentOk || !linkOk) {
                brokenAt.push(interval.intervalNo);
            }
            prevStored = interval.sha256Hash;
        }
        const last = intervals[intervals.length - 1];
        const observations = await this.db.waterTableObservation.findMany({
            where: { boreholeId },
        });
        let wtInvalid = 0;
        let wtUnhashed = 0;
        for (const obs of observations) {
            if (!obs.sha256Hash) {
                wtUnhashed += 1;
                continue;
            }
            const expected = this.integrity.computeRecordHash(null, this.integrity.hashWaterTablePayload(obs));
            if (expected !== obs.sha256Hash) {
                wtInvalid += 1;
            }
        }
        return {
            valid: brokenAt.length === 0 && wtInvalid === 0,
            intervalCount: intervals.length,
            brokenAt,
            unhashed,
            chainRoot: last?.sha256Hash ?? null,
            waterTable: {
                total: observations.length,
                invalid: wtInvalid,
                unhashed: wtUnhashed,
            },
        };
    }
    safeFileName(value) {
        const cleaned = value.replace(/[^A-Za-z0-9._-]+/g, '_');
        return cleaned.length > 0 ? cleaned : 'borehole';
    }
    csvEscape(value) {
        if (value === null || value === undefined) {
            return '';
        }
        const text = value instanceof Date ? value.toISOString() : String(value);
        return /[",\r\n]/.test(text) ? `"${text.replace(/"/g, '""')}"` : text;
    }
};
exports.BoreholesService = BoreholesService;
exports.BoreholesService = BoreholesService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [database_service_1.DatabaseService,
        activity_logs_service_1.ActivityLogsService,
        project_access_service_1.ProjectAccessService,
        integrity_service_1.IntegrityService])
], BoreholesService);
//# sourceMappingURL=boreholes.service.js.map