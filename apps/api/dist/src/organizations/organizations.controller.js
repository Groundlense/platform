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
exports.OrganizationsController = void 0;
const common_1 = require("@nestjs/common");
const swagger_1 = require("@nestjs/swagger");
const jwt_auth_guard_1 = require("../auth/guards/jwt-auth.guard");
const permissions_guard_1 = require("../auth/guards/permissions.guard");
const permissions_decorator_1 = require("../auth/decorators/permissions.decorator");
const current_user_decorator_1 = require("../auth/decorators/current-user.decorator");
const organizations_service_1 = require("./organizations.service");
const create_organization_dto_1 = require("./dto/create-organization.dto");
const update_organization_dto_1 = require("./dto/update-organization.dto");
const list_organizations_query_dto_1 = require("./dto/list-organizations-query.dto");
const invite_members_dto_1 = require("./dto/invite-members.dto");
let OrganizationsController = class OrganizationsController {
    organizationsService;
    constructor(organizationsService) {
        this.organizationsService = organizationsService;
    }
    findAll(query) {
        return this.organizationsService.findAll(query.type);
    }
    create(dto, user) {
        return this.organizationsService.create(dto, user);
    }
    findOne(organizationId, user) {
        return this.organizationsService.findOne(organizationId, user);
    }
    update(organizationId, dto, user) {
        return this.organizationsService.update(organizationId, dto, user);
    }
    verifyKyc(organizationId, user) {
        return this.organizationsService.verifyKyc(organizationId, user);
    }
    inviteMembers(dto, user) {
        return this.organizationsService.inviteMembers(dto, user);
    }
    getJoinRequests(user) {
        return this.organizationsService.getJoinRequests(user);
    }
    approveJoinRequest(requestId, user) {
        return this.organizationsService.approveJoinRequest(requestId, user);
    }
    rejectJoinRequest(requestId, user) {
        return this.organizationsService.rejectJoinRequest(requestId, user);
    }
};
exports.OrganizationsController = OrganizationsController;
__decorate([
    (0, common_1.Get)(),
    __param(0, (0, common_1.Query)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [list_organizations_query_dto_1.ListOrganizationsQueryDto]),
    __metadata("design:returntype", void 0)
], OrganizationsController.prototype, "findAll", null);
__decorate([
    (0, permissions_decorator_1.Permissions)('ORG_MANAGE'),
    (0, common_1.Post)(),
    __param(0, (0, common_1.Body)()),
    __param(1, (0, current_user_decorator_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [create_organization_dto_1.CreateOrganizationDto, Object]),
    __metadata("design:returntype", void 0)
], OrganizationsController.prototype, "create", null);
__decorate([
    (0, common_1.Get)(':id'),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, current_user_decorator_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", void 0)
], OrganizationsController.prototype, "findOne", null);
__decorate([
    (0, permissions_decorator_1.Permissions)('ORG_MANAGE'),
    (0, common_1.Patch)(':id'),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Body)()),
    __param(2, (0, current_user_decorator_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, update_organization_dto_1.UpdateOrganizationDto, Object]),
    __metadata("design:returntype", void 0)
], OrganizationsController.prototype, "update", null);
__decorate([
    (0, permissions_decorator_1.Permissions)('ORG_KYC_VERIFY'),
    (0, common_1.Patch)(':id/kyc-verify'),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, current_user_decorator_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", void 0)
], OrganizationsController.prototype, "verifyKyc", null);
__decorate([
    (0, permissions_decorator_1.Permissions)('USER_MANAGE'),
    (0, common_1.Post)('invite-members'),
    __param(0, (0, common_1.Body)()),
    __param(1, (0, current_user_decorator_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [invite_members_dto_1.InviteMembersDto, Object]),
    __metadata("design:returntype", void 0)
], OrganizationsController.prototype, "inviteMembers", null);
__decorate([
    (0, permissions_decorator_1.Permissions)('USER_MANAGE'),
    (0, common_1.Get)('join-requests'),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", void 0)
], OrganizationsController.prototype, "getJoinRequests", null);
__decorate([
    (0, permissions_decorator_1.Permissions)('USER_MANAGE'),
    (0, common_1.Post)('join-requests/:requestId/approve'),
    __param(0, (0, common_1.Param)('requestId')),
    __param(1, (0, current_user_decorator_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", void 0)
], OrganizationsController.prototype, "approveJoinRequest", null);
__decorate([
    (0, permissions_decorator_1.Permissions)('USER_MANAGE'),
    (0, common_1.Post)('join-requests/:requestId/reject'),
    __param(0, (0, common_1.Param)('requestId')),
    __param(1, (0, current_user_decorator_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", void 0)
], OrganizationsController.prototype, "rejectJoinRequest", null);
exports.OrganizationsController = OrganizationsController = __decorate([
    (0, swagger_1.ApiTags)('Organizations'),
    (0, swagger_1.ApiBearerAuth)(),
    (0, common_1.Controller)('organizations'),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard, permissions_guard_1.PermissionsGuard),
    __metadata("design:paramtypes", [organizations_service_1.OrganizationsService])
], OrganizationsController);
//# sourceMappingURL=organizations.controller.js.map