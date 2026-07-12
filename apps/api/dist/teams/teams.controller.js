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
exports.TeamsController = void 0;
const common_1 = require("@nestjs/common");
const swagger_1 = require("@nestjs/swagger");
const jwt_auth_guard_1 = require("../auth/guards/jwt-auth.guard");
const current_user_decorator_1 = require("../auth/decorators/current-user.decorator");
const teams_service_1 = require("./teams.service");
const create_team_dto_1 = require("./dto/create-team.dto");
const add_team_member_dto_1 = require("./dto/add-team-member.dto");
let TeamsController = class TeamsController {
    teamsService;
    constructor(teamsService) {
        this.teamsService = teamsService;
    }
    createTeam(organizationId, dto, user) {
        return this.teamsService.createTeam(organizationId, dto, user);
    }
    getTeams(organizationId, projectId, user) {
        return this.teamsService.getTeams(organizationId, projectId, user);
    }
    addMember(teamId, dto, user) {
        return this.teamsService.addMember(teamId, dto.userId, user);
    }
    getTeam(teamId, user) {
        return this.teamsService.getTeam(teamId, user);
    }
    getDashboard(teamId, user) {
        return this.teamsService.getDashboard(teamId, user);
    }
    deleteTeam(teamId, user) {
        return this.teamsService.deleteTeam(teamId, user);
    }
    deleteTeamMember(teamId, userId, user) {
        return this.teamsService.removeMember(teamId, userId, user);
    }
};
exports.TeamsController = TeamsController;
__decorate([
    (0, common_1.Post)('organizations/:organizationId/teams'),
    __param(0, (0, common_1.Param)('organizationId')),
    __param(1, (0, common_1.Body)()),
    __param(2, (0, current_user_decorator_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, create_team_dto_1.CreateTeamDto, Object]),
    __metadata("design:returntype", void 0)
], TeamsController.prototype, "createTeam", null);
__decorate([
    (0, common_1.Get)('organizations/:organizationId/teams'),
    __param(0, (0, common_1.Param)('organizationId')),
    __param(1, (0, common_1.Query)('projectId')),
    __param(2, (0, current_user_decorator_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object, Object]),
    __metadata("design:returntype", void 0)
], TeamsController.prototype, "getTeams", null);
__decorate([
    (0, common_1.Post)('teams/:teamId/members'),
    __param(0, (0, common_1.Param)('teamId')),
    __param(1, (0, common_1.Body)()),
    __param(2, (0, current_user_decorator_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, add_team_member_dto_1.AddTeamMemberDto, Object]),
    __metadata("design:returntype", void 0)
], TeamsController.prototype, "addMember", null);
__decorate([
    (0, common_1.Get)('teams/:teamId'),
    __param(0, (0, common_1.Param)('teamId')),
    __param(1, (0, current_user_decorator_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", void 0)
], TeamsController.prototype, "getTeam", null);
__decorate([
    (0, common_1.Get)('teams/:teamId/dashboard'),
    __param(0, (0, common_1.Param)('teamId')),
    __param(1, (0, current_user_decorator_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", void 0)
], TeamsController.prototype, "getDashboard", null);
__decorate([
    (0, common_1.Delete)('teams/:teamId'),
    __param(0, (0, common_1.Param)('teamId')),
    __param(1, (0, current_user_decorator_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", void 0)
], TeamsController.prototype, "deleteTeam", null);
__decorate([
    (0, common_1.Delete)('teams/:teamId/members/:userId'),
    __param(0, (0, common_1.Param)('teamId')),
    __param(1, (0, common_1.Param)('userId')),
    __param(2, (0, current_user_decorator_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String, Object]),
    __metadata("design:returntype", void 0)
], TeamsController.prototype, "deleteTeamMember", null);
exports.TeamsController = TeamsController = __decorate([
    (0, swagger_1.ApiTags)('Teams'),
    (0, swagger_1.ApiBearerAuth)(),
    (0, common_1.Controller)(),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard),
    __metadata("design:paramtypes", [teams_service_1.TeamsService])
], TeamsController);
//# sourceMappingURL=teams.controller.js.map