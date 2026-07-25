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
exports.UsersController = void 0;
const common_1 = require("@nestjs/common");
const swagger_1 = require("@nestjs/swagger");
const users_service_1 = require("./users.service");
const common_2 = require("@nestjs/common");
const create_user_dto_1 = require("./dto/create-user.dto");
const common_3 = require("@nestjs/common");
const update_user_status_dto_1 = require("./dto/update-user-status.dto");
const reset_pin_dto_1 = require("./dto/reset-pin.dto");
const update_profile_dto_1 = require("./dto/update-profile.dto");
const jwt_auth_guard_1 = require("../auth/guards/jwt-auth.guard");
const permissions_guard_1 = require("../auth/guards/permissions.guard");
const permissions_decorator_1 = require("../auth/decorators/permissions.decorator");
const current_user_decorator_1 = require("../auth/decorators/current-user.decorator");
let UsersController = class UsersController {
    usersService;
    constructor(usersService) {
        this.usersService = usersService;
    }
    findAll(user) {
        return this.usersService.findAll(user);
    }
    findByMobile(mobile) {
        return this.usersService.findByMobile(mobile);
    }
    createUser(dto, user) {
        return this.usersService.createUser(dto, user);
    }
    updateStatus(userId, dto, user) {
        return this.usersService.updateStatus(userId, dto.status, user);
    }
    findOne(userId, user) {
        return this.usersService.findOne(userId, user);
    }
    resetPin(userId, dto, user) {
        return this.usersService.resetPin(userId, dto.pin, user);
    }
    updateProfile(userId, dto, user) {
        return this.usersService.updateProfile(userId, dto, user);
    }
};
exports.UsersController = UsersController;
__decorate([
    (0, permissions_decorator_1.Permissions)('USER_VIEW'),
    (0, common_1.Get)(),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", void 0)
], UsersController.prototype, "findAll", null);
__decorate([
    (0, permissions_decorator_1.Permissions)('USER_VIEW'),
    (0, common_1.Get)('by-mobile/:mobile'),
    __param(0, (0, common_3.Param)('mobile')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", void 0)
], UsersController.prototype, "findByMobile", null);
__decorate([
    (0, permissions_decorator_1.Permissions)('USER_MANAGE'),
    (0, common_2.Post)(),
    __param(0, (0, common_2.Body)()),
    __param(1, (0, current_user_decorator_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [create_user_dto_1.CreateUserDto, Object]),
    __metadata("design:returntype", void 0)
], UsersController.prototype, "createUser", null);
__decorate([
    (0, permissions_decorator_1.Permissions)('USER_MANAGE'),
    (0, common_3.Patch)(':id/status'),
    __param(0, (0, common_3.Param)('id')),
    __param(1, (0, common_2.Body)()),
    __param(2, (0, current_user_decorator_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, update_user_status_dto_1.UpdateUserStatusDto, Object]),
    __metadata("design:returntype", void 0)
], UsersController.prototype, "updateStatus", null);
__decorate([
    (0, permissions_decorator_1.Permissions)('USER_VIEW'),
    (0, common_1.Get)(':id'),
    __param(0, (0, common_3.Param)('id')),
    __param(1, (0, current_user_decorator_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", void 0)
], UsersController.prototype, "findOne", null);
__decorate([
    (0, permissions_decorator_1.Permissions)('USER_MANAGE'),
    (0, common_3.Patch)(':id/reset-pin'),
    __param(0, (0, common_3.Param)('id')),
    __param(1, (0, common_2.Body)()),
    __param(2, (0, current_user_decorator_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, reset_pin_dto_1.ResetPinDto, Object]),
    __metadata("design:returntype", void 0)
], UsersController.prototype, "resetPin", null);
__decorate([
    (0, common_3.Patch)(':id/profile'),
    __param(0, (0, common_3.Param)('id')),
    __param(1, (0, common_2.Body)()),
    __param(2, (0, current_user_decorator_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, update_profile_dto_1.UpdateProfileDto, Object]),
    __metadata("design:returntype", void 0)
], UsersController.prototype, "updateProfile", null);
exports.UsersController = UsersController = __decorate([
    (0, swagger_1.ApiTags)('Users'),
    (0, swagger_1.ApiBearerAuth)(),
    (0, common_1.Controller)('users'),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard, permissions_guard_1.PermissionsGuard),
    __metadata("design:paramtypes", [users_service_1.UsersService])
], UsersController);
//# sourceMappingURL=users.controller.js.map