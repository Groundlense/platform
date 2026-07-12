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
var MediaService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.MediaService = void 0;
const common_1 = require("@nestjs/common");
const path_1 = require("path");
const fs_1 = require("fs");
const database_service_1 = require("../database/database.service");
const activity_logs_service_1 = require("../activity-logs/activity-logs.service");
const project_access_service_1 = require("../common/access/project-access.service");
const photo_stamp_1 = require("./photo-stamp");
let MediaService = MediaService_1 = class MediaService {
    db;
    activityLogsService;
    access;
    logger = new common_1.Logger(MediaService_1.name);
    constructor(db, activityLogsService, access) {
        this.db = db;
        this.activityLogsService = activityLogsService;
        this.access = access;
    }
    async create(intervalId, file, user, meta) {
        await this.access.assertIntervalAccess(user, intervalId);
        const num = (v) => {
            const n = Number(v);
            return v != null && Number.isFinite(n) ? n : null;
        };
        const PHOTO_TYPE_BY_PURPOSE = {
            SPT: 'SOIL_SAMPLE',
            SAMPLE: 'SOIL_SAMPLE',
            CORE_BOX: 'CORE_BOX',
            SITE_SETUP: 'SITE_SETUP',
            CLOSURE: 'SITE_SETUP',
        };
        const photoType = meta?.purpose
            ? PHOTO_TYPE_BY_PURPOSE[meta.purpose] ?? null
            : null;
        if ((0, photo_stamp_1.isStampable)(file.mimetype)) {
            try {
                const interval = await this.db.boreholeInterval.findUnique({
                    where: { id: intervalId },
                    select: {
                        borehole: {
                            select: {
                                boreholeCode: true,
                                name: true,
                                structureType: true,
                                chainage: true,
                                span: true,
                            },
                        },
                    },
                });
                const bh = interval?.borehole;
                await (0, photo_stamp_1.stampGeoTag)((0, path_1.join)(process.cwd(), 'uploads', file.filename), {
                    boreholeCode: bh?.boreholeCode,
                    subStructure: bh?.name,
                    structureType: bh?.structureType,
                    chainage: bh?.chainage,
                    span: bh?.span,
                    gpsLat: num(meta?.gpsLat),
                    gpsLng: num(meta?.gpsLng),
                    accuracyM: num(meta?.accuracyM),
                    takenAt: meta?.takenAt,
                });
            }
            catch (err) {
                this.logger.warn(`Geo-tag stamp failed for ${file.filename} — storing unstamped photo`, err instanceof Error ? err.message : String(err));
            }
        }
        const media = await this.db.media.create({
            data: {
                intervalId,
                fileName: file.originalname,
                filePath: file.filename,
                mimeType: file.mimetype,
                mediaType: 'PHOTO',
                uploadedByUserId: user.id,
                gpsLat: num(meta?.gpsLat),
                gpsLng: num(meta?.gpsLng),
                accuracyM: num(meta?.accuracyM),
                takenAt: meta?.takenAt && !Number.isNaN(new Date(meta.takenAt).getTime())
                    ? new Date(meta.takenAt)
                    : null,
                photoType,
            },
        });
        await this.activityLogsService.log(user.id, 'MEDIA_UPLOADED', 'MEDIA', media.id);
        return media;
    }
    async getByInterval(intervalId, user) {
        await this.access.assertIntervalAccess(user, intervalId);
        return this.db.media.findMany({
            where: {
                intervalId,
            },
            orderBy: {
                createdAt: 'desc',
            },
        });
    }
    async getFile(mediaId, user) {
        const media = await this.db.media.findUnique({
            where: { id: mediaId },
        });
        if (!media || !media.intervalId) {
            throw new common_1.NotFoundException('Media not found');
        }
        await this.access.assertIntervalAccess(user, media.intervalId);
        const absolutePath = (0, path_1.join)(process.cwd(), 'uploads', media.filePath);
        if (!(0, fs_1.existsSync)(absolutePath)) {
            throw new common_1.NotFoundException('Media file missing on disk');
        }
        return { media, absolutePath };
    }
};
exports.MediaService = MediaService;
exports.MediaService = MediaService = MediaService_1 = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [database_service_1.DatabaseService,
        activity_logs_service_1.ActivityLogsService,
        project_access_service_1.ProjectAccessService])
], MediaService);
//# sourceMappingURL=media.service.js.map