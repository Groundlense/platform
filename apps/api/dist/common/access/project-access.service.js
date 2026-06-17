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
exports.ProjectAccessService = void 0;
const common_1 = require("@nestjs/common");
const database_service_1 = require("../../database/database.service");
let ProjectAccessService = class ProjectAccessService {
    db;
    constructor(db) {
        this.db = db;
    }
    isSuperAdmin(user) {
        return user?.roles?.includes('SUPER_ADMIN') ?? false;
    }
    projectScopeWhere(user) {
        if (this.isSuperAdmin(user)) {
            return {};
        }
        return {
            OR: [
                { epcOrganizationId: user.organizationId },
                { geotechOrganizationId: user.organizationId },
                {
                    members: {
                        some: { userId: user.id },
                    },
                },
                {
                    projectCompanies: {
                        some: {
                            companyId: user.organizationId,
                            isActive: true,
                            inviteAcceptedAt: { not: null },
                        },
                    },
                },
                {
                    userProjectRoles: {
                        some: {
                            userId: user.id,
                            revokedAt: null,
                        },
                    },
                },
            ],
        };
    }
    async canAccessProject(user, projectId) {
        if (this.isSuperAdmin(user)) {
            return true;
        }
        const project = await this.db.project.findFirst({
            where: {
                id: projectId,
                ...this.projectScopeWhere(user),
            },
            select: { id: true },
        });
        return project !== null;
    }
    async assertProjectAccess(user, projectId) {
        const project = await this.db.project.findUnique({
            where: { id: projectId },
            select: { id: true },
        });
        if (!project) {
            throw new common_1.NotFoundException('Project not found');
        }
        if (!(await this.canAccessProject(user, projectId))) {
            throw new common_1.ForbiddenException('No access to this project');
        }
    }
    async assertBoreholeAccess(user, boreholeId) {
        const borehole = await this.db.borehole.findUnique({
            where: { id: boreholeId },
        });
        if (!borehole) {
            throw new common_1.NotFoundException('Borehole not found');
        }
        if (!(await this.canAccessProject(user, borehole.projectId))) {
            throw new common_1.ForbiddenException('No access to this borehole');
        }
        return borehole;
    }
    async assertIntervalAccess(user, intervalId) {
        const interval = await this.db.boreholeInterval.findUnique({
            where: { id: intervalId },
            include: {
                borehole: { select: { projectId: true } },
            },
        });
        if (!interval) {
            throw new common_1.NotFoundException('Interval not found');
        }
        if (!(await this.canAccessProject(user, interval.borehole.projectId))) {
            throw new common_1.ForbiddenException('No access to this interval');
        }
        return interval;
    }
    async getProjectRole(user, projectId) {
        const assignment = await this.db.userProjectRole.findFirst({
            where: {
                userId: user.id,
                projectId,
                revokedAt: null,
            },
            orderBy: { assignedAt: 'desc' },
            include: {
                role: { select: { code: true } },
            },
        });
        if (assignment) {
            return assignment.role.code;
        }
        const partyProject = await this.db.project.findFirst({
            where: {
                id: projectId,
                OR: [
                    { epcOrganizationId: user.organizationId },
                    { geotechOrganizationId: user.organizationId },
                    {
                        projectCompanies: {
                            some: {
                                companyId: user.organizationId,
                                isActive: true,
                                inviteAcceptedAt: { not: null },
                            },
                        },
                    },
                ],
            },
            select: { id: true },
        });
        return partyProject ? 'COMPANY_PARTY' : null;
    }
    async assertProjectRole(user, projectId, allowed) {
        if (this.isSuperAdmin(user)) {
            return;
        }
        const role = await this.getProjectRole(user, projectId);
        if (!role || !allowed.includes(role)) {
            throw new common_1.ForbiddenException('Your project role does not permit this action');
        }
    }
    assertSameOrganization(user, organizationId) {
        if (!this.isSuperAdmin(user) && user.organizationId !== organizationId) {
            throw new common_1.ForbiddenException('Resource belongs to another organization');
        }
    }
};
exports.ProjectAccessService = ProjectAccessService;
exports.ProjectAccessService = ProjectAccessService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [database_service_1.DatabaseService])
], ProjectAccessService);
//# sourceMappingURL=project-access.service.js.map