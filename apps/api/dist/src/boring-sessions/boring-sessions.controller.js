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
exports.BoringSessionsController = void 0;
const common_1 = require("@nestjs/common");
const swagger_1 = require("@nestjs/swagger");
const jwt_auth_guard_1 = require("../auth/guards/jwt-auth.guard");
const permissions_guard_1 = require("../auth/guards/permissions.guard");
const permissions_decorator_1 = require("../auth/decorators/permissions.decorator");
const current_user_decorator_1 = require("../auth/decorators/current-user.decorator");
const boring_sessions_service_1 = require("./boring-sessions.service");
const create_boring_session_dto_1 = require("./dto/create-boring-session.dto");
const end_boring_session_dto_1 = require("./dto/end-boring-session.dto");
let BoringSessionsController = class BoringSessionsController {
    boringSessionsService;
    constructor(boringSessionsService) {
        this.boringSessionsService = boringSessionsService;
    }
    start(boreholeId, user, dto) {
        return this.boringSessionsService.start(boreholeId, user.id, dto);
    }
    end(sessionId, dto) {
        return this.boringSessionsService.end(sessionId, dto);
    }
    findByBorehole(boreholeId) {
        return this.boringSessionsService.findByBorehole(boreholeId);
    }
};
exports.BoringSessionsController = BoringSessionsController;
__decorate([
    (0, permissions_decorator_1.Permissions)('SPT_CREATE'),
    (0, common_1.Post)('boreholes/:id/sessions'),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, current_user_decorator_1.CurrentUser)()),
    __param(2, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object, create_boring_session_dto_1.CreateBoringSessionDto]),
    __metadata("design:returntype", void 0)
], BoringSessionsController.prototype, "start", null);
__decorate([
    (0, permissions_decorator_1.Permissions)('SPT_CREATE'),
    (0, common_1.Patch)('sessions/:sessionId/end'),
    __param(0, (0, common_1.Param)('sessionId')),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, end_boring_session_dto_1.EndBoringSessionDto]),
    __metadata("design:returntype", void 0)
], BoringSessionsController.prototype, "end", null);
__decorate([
    (0, permissions_decorator_1.Permissions)('BOREHOLE_VIEW'),
    (0, common_1.Get)('boreholes/:id/sessions'),
    __param(0, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", void 0)
], BoringSessionsController.prototype, "findByBorehole", null);
exports.BoringSessionsController = BoringSessionsController = __decorate([
    (0, swagger_1.ApiTags)('Boring Sessions'),
    (0, swagger_1.ApiBearerAuth)(),
    (0, common_1.Controller)(),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard, permissions_guard_1.PermissionsGuard),
    __metadata("design:paramtypes", [boring_sessions_service_1.BoringSessionsService])
], BoringSessionsController);
//# sourceMappingURL=boring-sessions.controller.js.map