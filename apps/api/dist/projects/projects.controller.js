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
exports.ProjectsController = void 0;
const common_1 = require("@nestjs/common");
const projects_service_1 = require("./projects.service");
const create_project_dto_1 = require("./dto/create-project.dto");
const jwt_auth_guard_1 = require("../auth/guards/jwt-auth.guard");
const current_user_decorator_1 = require("../auth/decorators/current-user.decorator");
const add_project_member_dto_1 = require("./dto/add-project-member.dto");
const invite_project_company_dto_1 = require("./dto/invite-project-company.dto");
const respond_project_company_dto_1 = require("./dto/respond-project-company.dto");
const assign_project_role_dto_1 = require("./dto/assign-project-role.dto");
const common_2 = require("@nestjs/common");
const swagger_1 = require("@nestjs/swagger");
const permissions_decorator_1 = require("../auth/decorators/permissions.decorator");
const permissions_guard_1 = require("../auth/guards/permissions.guard");
let ProjectsController = class ProjectsController {
    projectsService;
    constructor(projectsService) {
        this.projectsService = projectsService;
    }
    create(dto, user) {
        return this.projectsService.create(dto, user.id, user.organizationId);
    }
    findAll(user) {
        return this.projectsService.findAll(user);
    }
    search(code, user) {
        if (!code) {
            throw new common_1.BadRequestException('Query parameter "code" is required');
        }
        return this.projectsService.searchByCode(code, user);
    }
    addMember(projectId, dto, user) {
        return this.projectsService.addMember(projectId, dto.userId, user);
    }
    getMembers(projectId, user) {
        return this.projectsService.getMembers(projectId, user);
    }
    getMyProjects(user) {
        return this.projectsService.getMyProjects(user.id);
    }
    inviteCompany(projectId, dto, user) {
        return this.projectsService.inviteCompany(projectId, dto, user);
    }
    getCompanies(projectId, user) {
        return this.projectsService.getCompanies(projectId, user);
    }
    respondToCompanyInvite(projectId, companyLinkId, dto, user) {
        return this.projectsService.respondToCompanyInvite(projectId, companyLinkId, dto.accept, user);
    }
    removeCompanyLink(projectId, companyLinkId, user) {
        return this.projectsService.removeCompanyLink(projectId, companyLinkId, user);
    }
    assignUserRole(projectId, dto, user) {
        return this.projectsService.assignUserRole(projectId, dto, user);
    }
    getUserRoles(projectId, user) {
        return this.projectsService.getUserRoles(projectId, user);
    }
};
exports.ProjectsController = ProjectsController;
__decorate([
    (0, permissions_decorator_1.Permissions)('PROJECT_CREATE'),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard, permissions_guard_1.PermissionsGuard),
    (0, common_1.Post)(),
    __param(0, (0, common_1.Body)()),
    __param(1, (0, current_user_decorator_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [create_project_dto_1.CreateProjectDto, Object]),
    __metadata("design:returntype", void 0)
], ProjectsController.prototype, "create", null);
__decorate([
    (0, common_1.Get)(),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", void 0)
], ProjectsController.prototype, "findAll", null);
__decorate([
    (0, common_1.Get)('search'),
    __param(0, (0, common_1.Query)('code')),
    __param(1, (0, current_user_decorator_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", void 0)
], ProjectsController.prototype, "search", null);
__decorate([
    (0, common_1.Post)(':projectId/members'),
    __param(0, (0, common_2.Param)('projectId')),
    __param(1, (0, common_1.Body)()),
    __param(2, (0, current_user_decorator_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, add_project_member_dto_1.AddProjectMemberDto, Object]),
    __metadata("design:returntype", void 0)
], ProjectsController.prototype, "addMember", null);
__decorate([
    (0, common_1.Get)(':projectId/members'),
    __param(0, (0, common_2.Param)('projectId')),
    __param(1, (0, current_user_decorator_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", void 0)
], ProjectsController.prototype, "getMembers", null);
__decorate([
    (0, common_1.Get)('/my-projects'),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", void 0)
], ProjectsController.prototype, "getMyProjects", null);
__decorate([
    (0, permissions_decorator_1.Permissions)('PROJECT_EDIT'),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard, permissions_guard_1.PermissionsGuard),
    (0, common_1.Post)(':projectId/companies'),
    __param(0, (0, common_2.Param)('projectId')),
    __param(1, (0, common_1.Body)()),
    __param(2, (0, current_user_decorator_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, invite_project_company_dto_1.InviteProjectCompanyDto, Object]),
    __metadata("design:returntype", void 0)
], ProjectsController.prototype, "inviteCompany", null);
__decorate([
    (0, permissions_decorator_1.Permissions)('PROJECT_VIEW'),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard, permissions_guard_1.PermissionsGuard),
    (0, common_1.Get)(':projectId/companies'),
    __param(0, (0, common_2.Param)('projectId')),
    __param(1, (0, current_user_decorator_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", void 0)
], ProjectsController.prototype, "getCompanies", null);
__decorate([
    (0, common_1.Patch)(':projectId/companies/:companyLinkId/respond'),
    __param(0, (0, common_2.Param)('projectId')),
    __param(1, (0, common_2.Param)('companyLinkId')),
    __param(2, (0, common_1.Body)()),
    __param(3, (0, current_user_decorator_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String, respond_project_company_dto_1.RespondProjectCompanyDto, Object]),
    __metadata("design:returntype", void 0)
], ProjectsController.prototype, "respondToCompanyInvite", null);
__decorate([
    (0, permissions_decorator_1.Permissions)('PROJECT_EDIT'),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard, permissions_guard_1.PermissionsGuard),
    (0, common_1.Delete)(':projectId/companies/:companyLinkId'),
    __param(0, (0, common_2.Param)('projectId')),
    __param(1, (0, common_2.Param)('companyLinkId')),
    __param(2, (0, current_user_decorator_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String, Object]),
    __metadata("design:returntype", void 0)
], ProjectsController.prototype, "removeCompanyLink", null);
__decorate([
    (0, permissions_decorator_1.Permissions)('PROJECT_EDIT'),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard, permissions_guard_1.PermissionsGuard),
    (0, common_1.Post)(':projectId/user-roles'),
    __param(0, (0, common_2.Param)('projectId')),
    __param(1, (0, common_1.Body)()),
    __param(2, (0, current_user_decorator_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, assign_project_role_dto_1.AssignProjectRoleDto, Object]),
    __metadata("design:returntype", void 0)
], ProjectsController.prototype, "assignUserRole", null);
__decorate([
    (0, permissions_decorator_1.Permissions)('PROJECT_VIEW'),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard, permissions_guard_1.PermissionsGuard),
    (0, common_1.Get)(':projectId/user-roles'),
    __param(0, (0, common_2.Param)('projectId')),
    __param(1, (0, current_user_decorator_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", void 0)
], ProjectsController.prototype, "getUserRoles", null);
exports.ProjectsController = ProjectsController = __decorate([
    (0, swagger_1.ApiTags)('Projects'),
    (0, swagger_1.ApiBearerAuth)(),
    (0, common_1.Controller)('projects'),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard),
    __metadata("design:paramtypes", [projects_service_1.ProjectsService])
], ProjectsController);
//# sourceMappingURL=projects.controller.js.map