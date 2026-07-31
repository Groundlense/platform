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
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.MediaController = void 0;
const common_1 = require("@nestjs/common");
const platform_express_1 = require("@nestjs/platform-express");
const multer_1 = require("multer");
const path_1 = require("path");
const promises_1 = require("fs/promises");
const crypto_1 = require("crypto");
const jwt_auth_guard_1 = require("../auth/guards/jwt-auth.guard");
const current_user_decorator_1 = require("../auth/decorators/current-user.decorator");
const media_service_1 = require("./media.service");
const swagger_1 = require("@nestjs/swagger");
const ALLOWED_MIME_TYPES = [
    'image/jpeg',
    'image/png',
    'image/webp',
    'application/pdf',
    'video/mp4',
    'video/quicktime',
    'video/3gpp',
];
const VIDEO_MAX_BYTES = 100 * 1024 * 1024;
const IMAGE_MAX_BYTES = 15 * 1024 * 1024;
let MediaController = class MediaController {
    mediaService;
    constructor(mediaService) {
        this.mediaService = mediaService;
    }
    async upload(intervalId, file, user, body) {
        if (file &&
            !file.mimetype.startsWith('video/') &&
            file.size > IMAGE_MAX_BYTES) {
            await (0, promises_1.unlink)((0, path_1.join)(process.cwd(), 'uploads', file.filename)).catch(() => undefined);
            throw new common_1.BadRequestException('Images and documents must be 15 MB or smaller');
        }
        return this.mediaService.create(intervalId, file, user, body);
    }
    uploadSampleReport(sampleId, file, user) {
        if (!file) {
            throw new common_1.BadRequestException('No file received (field name: file)');
        }
        return this.mediaService.createSampleReport(sampleId, file, user);
    }
    getMedia(intervalId, user) {
        return this.mediaService.getByInterval(intervalId, user);
    }
    async getFile(mediaId, user, res) {
        const { media, absolutePath, redirectUrl } = await this.mediaService.getFile(mediaId, user);
        if (redirectUrl) {
            return res.redirect(302, redirectUrl);
        }
        res.setHeader('Content-Type', media.mimeType ?? 'application/octet-stream');
        return res.sendFile(absolutePath);
    }
};
exports.MediaController = MediaController;
__decorate([
    (0, common_1.Post)('intervals/:intervalId/media'),
    (0, common_1.UseInterceptors)((0, platform_express_1.FileInterceptor)('file', {
        storage: (0, multer_1.diskStorage)({
            destination: './uploads',
            filename: (req, file, cb) => {
                cb(null, `${Date.now()}-${(0, crypto_1.randomBytes)(6).toString('hex')}${(0, path_1.extname)(file.originalname)}`);
            },
        }),
        limits: {
            fileSize: VIDEO_MAX_BYTES,
        },
        fileFilter: (req, file, cb) => {
            if (!ALLOWED_MIME_TYPES.includes(file.mimetype)) {
                return cb(new common_1.BadRequestException(`Unsupported file type ${file.mimetype}`), false);
            }
            cb(null, true);
        },
    })),
    __param(0, (0, common_1.Param)('intervalId')),
    __param(1, (0, common_1.UploadedFile)()),
    __param(2, (0, current_user_decorator_1.CurrentUser)()),
    __param(3, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object, Object, Object]),
    __metadata("design:returntype", Promise)
], MediaController.prototype, "upload", null);
__decorate([
    (0, common_1.Post)('samples/:sampleId/report-pdf'),
    (0, common_1.UseInterceptors)((0, platform_express_1.FileInterceptor)('file', {
        storage: (0, multer_1.diskStorage)({
            destination: './uploads',
            filename: (req, file, cb) => {
                cb(null, `${Date.now()}-${(0, crypto_1.randomBytes)(6).toString('hex')}${(0, path_1.extname)(file.originalname)}`);
            },
        }),
        limits: {
            fileSize: IMAGE_MAX_BYTES,
        },
        fileFilter: (req, file, cb) => {
            if (file.mimetype !== 'application/pdf') {
                return cb(new common_1.BadRequestException('Lab report must be a PDF file'), false);
            }
            cb(null, true);
        },
    })),
    __param(0, (0, common_1.Param)('sampleId')),
    __param(1, (0, common_1.UploadedFile)()),
    __param(2, (0, current_user_decorator_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object, Object]),
    __metadata("design:returntype", void 0)
], MediaController.prototype, "uploadSampleReport", null);
__decorate([
    (0, common_1.Get)('intervals/:intervalId/media'),
    __param(0, (0, common_1.Param)('intervalId')),
    __param(1, (0, current_user_decorator_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", void 0)
], MediaController.prototype, "getMedia", null);
__decorate([
    (0, common_1.Get)('media/:id/file'),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, current_user_decorator_1.CurrentUser)()),
    __param(2, (0, common_1.Res)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object, Object]),
    __metadata("design:returntype", Promise)
], MediaController.prototype, "getFile", null);
exports.MediaController = MediaController = __decorate([
    (0, swagger_1.ApiTags)('Media'),
    (0, swagger_1.ApiBearerAuth)(),
    (0, common_1.Controller)(),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard),
    __metadata("design:paramtypes", [media_service_1.MediaService])
], MediaController);
//# sourceMappingURL=media.controller.js.map