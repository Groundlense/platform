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
exports.AuthController = void 0;
const common_1 = require("@nestjs/common");
const auth_service_1 = require("./auth.service");
const login_dto_1 = require("./dto/login.dto");
const jwt_auth_guard_1 = require("./guards/jwt-auth.guard");
const current_user_decorator_1 = require("./decorators/current-user.decorator");
const refresh_token_dto_1 = require("./dto/refresh-token.dto");
const register_dto_1 = require("./dto/register.dto");
const send_otp_dto_1 = require("./dto/send-otp.dto");
const verify_otp_dto_1 = require("./dto/verify-otp.dto");
const join_request_dto_1 = require("./dto/join-request.dto");
const accept_invite_dto_1 = require("./dto/accept-invite.dto");
const forgot_password_dto_1 = require("./dto/forgot-password.dto");
const reset_password_dto_1 = require("./dto/reset-password.dto");
const create_password_dto_1 = require("./dto/create-password.dto");
const platform_express_1 = require("@nestjs/platform-express");
const multer_1 = require("multer");
const path_1 = require("path");
const fs_1 = require("fs");
const crypto_1 = require("crypto");
const swagger_1 = require("@nestjs/swagger");
let AuthController = class AuthController {
    authService;
    constructor(authService) {
        this.authService = authService;
    }
    login(dto) {
        return this.authService.login(dto.identifier, dto.password);
    }
    register(dto) {
        return this.authService.register(dto);
    }
    refresh(dto) {
        return this.authService.refresh(dto.refreshToken);
    }
    logout(dto) {
        return this.authService.logout(dto.refreshToken);
    }
    getProfile(user) {
        return user;
    }
    sendOtp(dto) {
        return this.authService.sendOtp(dto);
    }
    verifyOtp(dto) {
        return this.authService.verifyOtp(dto);
    }
    verifyGst(gstin) {
        return this.authService.verifyGst(gstin);
    }
    uploadLogo(file) {
        if (!file) {
            throw new common_1.BadRequestException('File is required');
        }
        return {
            success: true,
            filename: file.filename,
            url: `/api/v1/auth/logo/${file.filename}`,
        };
    }
    getLogo(filename, res) {
        const absolutePath = (0, path_1.join)(process.cwd(), 'uploads', filename);
        if (!(0, fs_1.existsSync)(absolutePath)) {
            throw new common_1.BadRequestException('Logo file not found');
        }
        res.setHeader('Content-Type', 'image/' + (0, path_1.extname)(filename).substring(1));
        return res.sendFile(absolutePath);
    }
    getInviteDetails(token) {
        return this.authService.getInviteDetails(token);
    }
    acceptInvite(dto) {
        return this.authService.acceptInvite(dto);
    }
    joinRequest(dto) {
        return this.authService.createJoinRequest(dto);
    }
    forgotPassword(dto) {
        return this.authService.forgotPassword(dto.email);
    }
    resetPassword(dto) {
        return this.authService.resetPassword(dto.email, dto.code, dto.newPassword);
    }
    createPassword(dto) {
        return this.authService.createPassword(dto.mobile, dto.password);
    }
};
exports.AuthController = AuthController;
__decorate([
    (0, common_1.Post)('login'),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [login_dto_1.LoginDto]),
    __metadata("design:returntype", void 0)
], AuthController.prototype, "login", null);
__decorate([
    (0, common_1.Post)('register'),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [register_dto_1.RegisterDto]),
    __metadata("design:returntype", void 0)
], AuthController.prototype, "register", null);
__decorate([
    (0, common_1.Post)('refresh'),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [refresh_token_dto_1.RefreshTokenDto]),
    __metadata("design:returntype", void 0)
], AuthController.prototype, "refresh", null);
__decorate([
    (0, common_1.Post)('logout'),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [refresh_token_dto_1.RefreshTokenDto]),
    __metadata("design:returntype", void 0)
], AuthController.prototype, "logout", null);
__decorate([
    (0, common_1.Get)('me'),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", void 0)
], AuthController.prototype, "getProfile", null);
__decorate([
    (0, common_1.Post)('send-otp'),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [send_otp_dto_1.SendOtpDto]),
    __metadata("design:returntype", void 0)
], AuthController.prototype, "sendOtp", null);
__decorate([
    (0, common_1.Post)('verify-otp'),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [verify_otp_dto_1.VerifyOtpDto]),
    __metadata("design:returntype", void 0)
], AuthController.prototype, "verifyOtp", null);
__decorate([
    (0, common_1.Get)('verify-gst/:gstin'),
    __param(0, (0, common_1.Param)('gstin')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", void 0)
], AuthController.prototype, "verifyGst", null);
__decorate([
    (0, common_1.Post)('upload-logo'),
    (0, common_1.UseInterceptors)((0, platform_express_1.FileInterceptor)('file', {
        storage: (0, multer_1.diskStorage)({
            destination: (req, file, cb) => {
                let uploadPath = (0, path_1.join)(process.cwd(), 'uploads');
                if (!(0, fs_1.existsSync)(uploadPath) && (0, fs_1.existsSync)((0, path_1.join)(process.cwd(), 'apps/api/uploads'))) {
                    uploadPath = (0, path_1.join)(process.cwd(), 'apps/api/uploads');
                }
                if (!(0, fs_1.existsSync)(uploadPath)) {
                    (0, fs_1.mkdirSync)(uploadPath, { recursive: true });
                }
                cb(null, uploadPath);
            },
            filename: (req, file, cb) => {
                cb(null, `logo-${Date.now()}-${(0, crypto_1.randomBytes)(6).toString('hex')}${(0, path_1.extname)(file.originalname)}`);
            },
        }),
        limits: {
            fileSize: 5 * 1024 * 1024,
        },
        fileFilter: (req, file, cb) => {
            const allowedTypes = ['image/jpeg', 'image/png', 'image/webp'];
            if (!allowedTypes.includes(file.mimetype)) {
                return cb(new common_1.BadRequestException(`Unsupported file type ${file.mimetype}`), false);
            }
            cb(null, true);
        },
    })),
    __param(0, (0, common_1.UploadedFile)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", void 0)
], AuthController.prototype, "uploadLogo", null);
__decorate([
    (0, common_1.Get)('logo/:filename'),
    __param(0, (0, common_1.Param)('filename')),
    __param(1, (0, common_1.Res)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", void 0)
], AuthController.prototype, "getLogo", null);
__decorate([
    (0, common_1.Get)('invite/:token'),
    __param(0, (0, common_1.Param)('token')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", void 0)
], AuthController.prototype, "getInviteDetails", null);
__decorate([
    (0, common_1.Post)('accept-invite'),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [accept_invite_dto_1.AcceptInviteDto]),
    __metadata("design:returntype", void 0)
], AuthController.prototype, "acceptInvite", null);
__decorate([
    (0, common_1.Post)('join-request'),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [join_request_dto_1.JoinRequestDto]),
    __metadata("design:returntype", void 0)
], AuthController.prototype, "joinRequest", null);
__decorate([
    (0, common_1.Post)('forgot-password'),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [forgot_password_dto_1.ForgotPasswordDto]),
    __metadata("design:returntype", void 0)
], AuthController.prototype, "forgotPassword", null);
__decorate([
    (0, common_1.Post)('reset-password'),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [reset_password_dto_1.ResetPasswordDto]),
    __metadata("design:returntype", void 0)
], AuthController.prototype, "resetPassword", null);
__decorate([
    (0, common_1.Post)('create-password'),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [create_password_dto_1.CreatePasswordDto]),
    __metadata("design:returntype", void 0)
], AuthController.prototype, "createPassword", null);
exports.AuthController = AuthController = __decorate([
    (0, swagger_1.ApiTags)('Auth'),
    (0, common_1.Controller)('auth'),
    __metadata("design:paramtypes", [auth_service_1.AuthService])
], AuthController);
//# sourceMappingURL=auth.controller.js.map