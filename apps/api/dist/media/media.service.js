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
const promises_1 = require("fs/promises");
const database_service_1 = require("../database/database.service");
const activity_logs_service_1 = require("../activity-logs/activity-logs.service");
const project_access_service_1 = require("../common/access/project-access.service");
const photo_stamp_1 = require("./photo-stamp");
const cloudinary_1 = require("./cloudinary");
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
        const takenAtDate = meta?.takenAt && !Number.isNaN(new Date(meta.takenAt).getTime())
            ? new Date(meta.takenAt)
            : null;
        if (takenAtDate) {
            const duplicate = await this.db.media.findFirst({
                where: {
                    intervalId,
                    fileName: file.originalname,
                    uploadedByUserId: user.id,
                    takenAt: takenAtDate,
                },
            });
            if (duplicate) {
                await (0, promises_1.unlink)((0, path_1.join)(process.cwd(), 'uploads', file.filename)).catch(() => undefined);
                return duplicate;
            }
        }
        const PHOTO_TYPE_BY_PURPOSE = {
            SPT: 'SOIL_SAMPLE',
            SAMPLE: 'SOIL_SAMPLE',
            CORE_BOX: 'CORE_BOX',
            SITE_SETUP: 'SITE_SETUP',
            CLOSURE: 'SITE_SETUP',
            CLOSURE_VIDEO: 'CLOSURE_VIDEO',
        };
        const photoType = meta?.purpose
            ? PHOTO_TYPE_BY_PURPOSE[meta.purpose] ?? null
            : null;
        const PHOTO_LABEL_BY_PURPOSE = {
            SPT: 'SPT Sample',
            SAMPLE: 'Soil/Rock Sample',
            CORE_BOX: 'Rock Core Box',
            SITE_SETUP: 'Site / Rig Setup',
            CLOSURE: 'Borehole Closure',
            CLOSURE_VIDEO: 'Closure Video',
        };
        const photoLabel = meta?.purpose
            ? PHOTO_LABEL_BY_PURPOSE[meta.purpose] ?? meta.purpose
            : null;
        if ((0, photo_stamp_1.isStampable)(file.mimetype)) {
            try {
                const interval = await this.db.boreholeInterval.findUnique({
                    where: { id: intervalId },
                    select: {
                        intervalNo: true,
                        fromDepth: true,
                        toDepth: true,
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
                    photoLabel,
                    intervalNo: interval?.intervalNo,
                    fromDepth: interval?.fromDepth,
                    toDepth: interval?.toDepth,
                });
            }
            catch (err) {
                this.logger.warn(`Geo-tag stamp failed for ${file.filename} — storing unstamped photo`, err instanceof Error ? err.message : String(err));
            }
        }
        let filePath = file.filename;
        if ((0, cloudinary_1.isCloudinaryConfigured)()) {
            try {
                const localPath = (0, path_1.join)(process.cwd(), 'uploads', file.filename);
                filePath = await (0, cloudinary_1.uploadToCloudinary)(localPath, {
                    folder: 'groundlense',
                    fileName: file.originalname,
                    mimeType: file.mimetype,
                });
                await (0, promises_1.unlink)(localPath).catch(() => undefined);
            }
            catch (err) {
                this.logger.warn(`Cloudinary upload failed for ${file.filename} — keeping local copy`, err instanceof Error ? err.message : String(err));
            }
        }
        const media = await this.db.media.create({
            data: {
                intervalId,
                fileName: file.originalname,
                filePath,
                mimeType: file.mimetype,
                mediaType: file.mimetype.startsWith('video/') ? 'VIDEO' : 'PHOTO',
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
    async createSampleReport(sampleId, file, user) {
        const sample = await this.db.sample.findUnique({
            where: { id: sampleId },
            select: { id: true, intervalId: true },
        });
        if (!sample) {
            throw new common_1.NotFoundException('Sample not found');
        }
        await this.access.assertIntervalAccess(user, sample.intervalId);
        let filePath = file.filename;
        if ((0, cloudinary_1.isCloudinaryConfigured)()) {
            try {
                const localPath = (0, path_1.join)(process.cwd(), 'uploads', file.filename);
                filePath = await (0, cloudinary_1.uploadToCloudinary)(localPath, {
                    folder: 'groundlense/lab-reports',
                    fileName: file.originalname,
                    mimeType: file.mimetype,
                });
                await (0, promises_1.unlink)(localPath).catch(() => undefined);
            }
            catch (err) {
                this.logger.warn(`Cloudinary upload failed for ${file.filename} — keeping local copy`, err instanceof Error ? err.message : String(err));
            }
        }
        const media = await this.db.media.create({
            data: {
                intervalId: sample.intervalId,
                fileName: file.originalname,
                filePath,
                mimeType: file.mimetype,
                mediaType: 'DOCUMENT',
                entityType: 'SAMPLE',
                entityId: sampleId,
                uploadedByUserId: user.id,
            },
        });
        await this.activityLogsService.log(user.id, 'MEDIA_UPLOADED', 'MEDIA', media.id);
        return {
            id: media.id,
            url: (0, cloudinary_1.isRemoteFilePath)(filePath) ? filePath : null,
            fileName: file.originalname,
        };
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
        if ((0, cloudinary_1.isRemoteFilePath)(media.filePath)) {
            return { media, absolutePath: null, redirectUrl: media.filePath };
        }
        const absolutePath = (0, path_1.join)(process.cwd(), 'uploads', media.filePath);
        if (!(0, fs_1.existsSync)(absolutePath)) {
            throw new common_1.NotFoundException('Media file missing on disk');
        }
        return { media, absolutePath, redirectUrl: null };
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