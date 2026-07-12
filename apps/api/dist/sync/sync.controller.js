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
exports.SyncController = void 0;
const common_1 = require("@nestjs/common");
const swagger_1 = require("@nestjs/swagger");
const jwt_auth_guard_1 = require("../auth/guards/jwt-auth.guard");
const permissions_guard_1 = require("../auth/guards/permissions.guard");
const permissions_decorator_1 = require("../auth/decorators/permissions.decorator");
const sync_service_1 = require("./sync.service");
const create_sync_operations_dto_1 = require("./dto/create-sync-operations.dto");
const current_user_decorator_1 = require("../auth/decorators/current-user.decorator");
let SyncController = class SyncController {
    syncService;
    constructor(syncService) {
        this.syncService = syncService;
    }
    syncQueue(dto, user) {
        return this.syncService.syncQueue(dto, user);
    }
    getConflicts(deviceId, user) {
        return this.syncService.getConflicts(deviceId, user);
    }
};
exports.SyncController = SyncController;
__decorate([
    (0, permissions_decorator_1.Permissions)('SPT_CREATE'),
    (0, common_1.Post)('operations'),
    __param(0, (0, common_1.Body)()),
    __param(1, (0, current_user_decorator_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [create_sync_operations_dto_1.CreateSyncOperationsDto, Object]),
    __metadata("design:returntype", void 0)
], SyncController.prototype, "syncQueue", null);
__decorate([
    (0, permissions_decorator_1.Permissions)('BOREHOLE_VIEW'),
    (0, common_1.Get)('conflicts/:deviceId'),
    __param(0, (0, common_1.Param)('deviceId')),
    __param(1, (0, current_user_decorator_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", void 0)
], SyncController.prototype, "getConflicts", null);
exports.SyncController = SyncController = __decorate([
    (0, swagger_1.ApiTags)('Sync Queue'),
    (0, swagger_1.ApiBearerAuth)(),
    (0, common_1.Controller)('sync'),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard, permissions_guard_1.PermissionsGuard),
    __metadata("design:paramtypes", [sync_service_1.SyncService])
], SyncController);
//# sourceMappingURL=sync.controller.js.map