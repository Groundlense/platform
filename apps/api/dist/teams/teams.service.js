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
exports.TeamsService = void 0;
const common_1 = require("@nestjs/common");
const database_service_1 = require("../database/database.service");
const project_access_service_1 = require("../common/access/project-access.service");
const TEAM_MEMBER_USER_SELECT = {
    id: true,
    firstName: true,
    lastName: true,
    employeeCode: true,
    email: true,
    mobile: true,
    status: true,
    designation: true,
    userType: true,
    preferredLanguage: true,
};
let TeamsService = class TeamsService {
    db;
    access;
    constructor(db, access) {
        this.db = db;
        this.access = access;
    }
    async assertTeamAccess(actor, teamId) {
        const team = await this.db.team.findUnique({
            where: { id: teamId },
            select: { id: true, organizationId: true },
        });
        if (!team) {
            throw new common_1.NotFoundException('Team not found');
        }
        this.access.assertSameOrganization(actor, team.organizationId);
        return team;
    }
    async createTeam(organizationId, dto, actor) {
        this.access.assertSameOrganization(actor, organizationId);
        return this.db.team.create({
            data: {
                organizationId,
                code: dto.code,
                name: dto.name,
                description: dto.description,
            },
        });
    }
    async getTeams(organizationId, actor) {
        this.access.assertSameOrganization(actor, organizationId);
        return this.db.team.findMany({
            where: {
                organizationId,
            },
            include: {
                members: {
                    include: {
                        user: {
                            select: TEAM_MEMBER_USER_SELECT,
                        },
                    },
                },
            },
            orderBy: {
                code: 'asc',
            },
        });
    }
    async addMember(teamId, userId, actor) {
        await this.assertTeamAccess(actor, teamId);
        return this.db.teamMember.create({
            data: {
                teamId,
                userId,
            },
        });
    }
    async getTeam(teamId, actor) {
        await this.assertTeamAccess(actor, teamId);
        return this.db.team.findUnique({
            where: {
                id: teamId,
            },
            include: {
                members: {
                    include: {
                        user: {
                            select: TEAM_MEMBER_USER_SELECT,
                        },
                    },
                },
            },
        });
    }
    async getDashboard(teamId, actor) {
        await this.assertTeamAccess(actor, teamId);
        const team = await this.db.team.findUnique({
            where: {
                id: teamId,
            },
            include: {
                members: true,
                boreholes: true,
            },
        });
        const boreholes = team?.boreholes ?? [];
        return {
            teamId: team?.id,
            teamName: team?.name,
            members: team?.members.length ?? 0,
            boreholes: boreholes.length,
            planned: boreholes.filter((b) => b.status === 'PLANNED').length,
            inProgress: boreholes.filter((b) => b.status === 'IN_PROGRESS').length,
            completed: boreholes.filter((b) => b.status === 'COMPLETED').length,
            abandoned: boreholes.filter((b) => b.status === 'ABANDONED').length,
        };
    }
};
exports.TeamsService = TeamsService;
exports.TeamsService = TeamsService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [database_service_1.DatabaseService,
        project_access_service_1.ProjectAccessService])
], TeamsService);
//# sourceMappingURL=teams.service.js.map