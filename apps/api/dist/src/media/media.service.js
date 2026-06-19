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
exports.MediaService = void 0;
const common_1 = require("@nestjs/common");
const path_1 = require("path");
const fs_1 = require("fs");
const database_service_1 = require("../database/database.service");
const activity_logs_service_1 = require("../activity-logs/activity-logs.service");
const project_access_service_1 = require("../common/access/project-access.service");
let MediaService = class MediaService {
    db;
    activityLogsService;
    access;
    constructor(db, activityLogsService, access) {
        this.db = db;
        this.activityLogsService = activityLogsService;
        this.access = access;
    }
    async create(intervalId, file, user) {
        await this.access.assertIntervalAccess(user, intervalId);
        const media = await this.db.media.create({
            data: {
                intervalId,
                fileName: file.originalname,
                filePath: file.filename,
                mimeType: file.mimetype,
                mediaType: 'PHOTO',
                uploadedByUserId: user.id,
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
exports.MediaService = MediaService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [database_service_1.DatabaseService,
        activity_logs_service_1.ActivityLogsService,
        project_access_service_1.ProjectAccessService])
], MediaService);
//# sourceMappingURL=media.service.js.map