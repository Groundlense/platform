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
exports.ProjectsService = void 0;
const common_1 = require("@nestjs/common");
const database_service_1 = require("../database/database.service");
const activity_logs_service_1 = require("../activity-logs/activity-logs.service");
const project_access_service_1 = require("../common/access/project-access.service");
let ProjectsService = class ProjectsService {
    db;
    activityLogsService;
    access;
    constructor(db, activityLogsService, access) {
        this.db = db;
        this.activityLogsService = activityLogsService;
        this.access = access;
    }
    async create(dto, userId, organizationId) {
        const project = await this.db.project.create({
            data: {
                projectCode: dto.projectCode,
                name: dto.name,
                description: dto.description,
                startDate: dto.startDate
                    ? new Date(dto.startDate)
                    : null,
                endDate: dto.endDate
                    ? new Date(dto.endDate)
                    : null,
                createdByUserId: userId,
                epcOrganizationId: organizationId,
                geotechOrganizationId: dto.geotechOrganizationId,
            },
        });
        await this.activityLogsService.log(userId, 'PROJECT_CREATED', 'PROJECT', project.id, {
            projectCode: project.projectCode,
            projectName: project.name,
        });
        return project;
    }
    async findAll(user) {
        const projects = await this.db.project.findMany({
            where: this.access.projectScopeWhere(user),
            include: {
                epcOrganization: true,
                geotechOrganization: true,
            },
        });
        if (projects.length === 0) {
            return projects;
        }
        const grouped = await this.db.borehole.groupBy({
            by: ['projectId', 'status'],
            where: {
                projectId: {
                    in: projects.map((p) => p.id),
                },
            },
            _count: { _all: true },
        });
        const BOREHOLE_STATUSES = [
            'PLANNED',
            'IN_PROGRESS',
            'COMPLETED',
            'ABANDONED',
            'TERMINATED',
            'SUSPENDED',
        ];
        const countsByProject = new Map();
        for (const row of grouped) {
            const counts = countsByProject.get(row.projectId) ?? {};
            counts[row.status] = row._count._all;
            countsByProject.set(row.projectId, counts);
        }
        return projects.map((project) => {
            const counts = countsByProject.get(project.id) ?? {};
            const boreholeStatusCounts = Object.fromEntries(BOREHOLE_STATUSES.map((status) => [
                status,
                counts[status] ?? 0,
            ]));
            const totalBoreholes = Object.values(boreholeStatusCounts).reduce((sum, n) => sum + n, 0);
            return {
                ...project,
                boreholeStatusCounts,
                totalBoreholes,
            };
        });
    }
    async searchByCode(code, user) {
        const project = await this.db.project.findFirst({
            where: {
                projectCode: {
                    equals: code,
                    mode: 'insensitive',
                },
            },
            select: {
                id: true,
                projectCode: true,
                name: true,
                status: true,
                state: true,
                district: true,
            },
        });
        if (!project) {
            return { found: false };
        }
        const hasAccess = await this.access.canAccessProject(user, project.id);
        return {
            found: true,
            hasAccess,
            project,
        };
    }
    async addMember(projectId, userId, actor) {
        await this.access.assertProjectAccess(actor, projectId);
        return this.db.projectMember.create({
            data: {
                projectId,
                userId,
            },
        });
    }
    async getMembers(projectId, actor) {
        await this.access.assertProjectAccess(actor, projectId);
        return this.db.projectMember.findMany({
            where: {
                projectId,
            },
            include: {
                user: {
                    select: {
                        id: true,
                        firstName: true,
                        lastName: true,
                        employeeCode: true,
                        email: true,
                        designation: true,
                        userType: true,
                        preferredLanguage: true,
                    },
                },
            },
        });
    }
    async getMyProjects(userId) {
        return this.db.projectMember.findMany({
            where: {
                userId,
            },
            include: {
                project: {
                    include: {
                        epcOrganization: true,
                        geotechOrganization: true,
                    },
                },
            },
        });
    }
    async inviteCompany(projectId, dto, actor) {
        await this.access.assertProjectAccess(actor, projectId);
        const organization = await this.db.organization.findUnique({
            where: { id: dto.organizationId },
            select: { id: true, name: true },
        });
        if (!organization) {
            throw new common_1.NotFoundException('Organization not found');
        }
        const existing = await this.db.projectCompany.findFirst({
            where: {
                projectId,
                companyId: dto.organizationId,
                isActive: true,
            },
            select: { id: true },
        });
        if (existing) {
            throw new common_1.ConflictException('Company is already linked to this project');
        }
        const isSelfLink = dto.organizationId === actor.organizationId;
        const link = await this.db.projectCompany.create({
            data: {
                projectId,
                companyId: dto.organizationId,
                role: dto.role,
                invitedByUserId: actor.id,
                inviteAcceptedAt: isSelfLink
                    ? new Date()
                    : null,
            },
            include: {
                company: {
                    select: {
                        id: true,
                        name: true,
                        type: true,
                        city: true,
                    },
                },
            },
        });
        await this.activityLogsService.log(actor.id, 'PROJECT_COMPANY_INVITED', 'PROJECT_COMPANY', link.id, {
            projectId,
            organizationId: dto.organizationId,
            organizationName: organization.name,
            role: dto.role,
        }, {
            actorCompanyId: actor.organizationId,
        });
        return link;
    }
    async getCompanies(projectId, actor) {
        await this.access.assertProjectAccess(actor, projectId);
        return this.db.projectCompany.findMany({
            where: {
                projectId,
                isActive: true,
            },
            include: {
                company: {
                    select: {
                        id: true,
                        name: true,
                        type: true,
                        city: true,
                    },
                },
            },
            orderBy: { createdAt: 'asc' },
        });
    }
    async respondToCompanyInvite(projectId, companyLinkId, accept, actor) {
        const link = await this.db.projectCompany.findUnique({
            where: { id: companyLinkId },
        });
        if (!link || link.projectId !== projectId) {
            throw new common_1.NotFoundException('Project-company link not found');
        }
        if (actor.organizationId !== link.companyId &&
            !this.access.isSuperAdmin(actor)) {
            throw new common_1.ForbiddenException('Only the invited organization may respond to this invitation');
        }
        if (link.inviteAcceptedAt !== null ||
            !link.isActive) {
            throw new common_1.ConflictException('Invitation has already been responded to');
        }
        const updated = await this.db.projectCompany.update({
            where: { id: companyLinkId },
            data: accept
                ? { inviteAcceptedAt: new Date() }
                : { isActive: false },
        });
        await this.activityLogsService.log(actor.id, accept
            ? 'PROJECT_COMPANY_INVITE_ACCEPTED'
            : 'PROJECT_COMPANY_INVITE_DECLINED', 'PROJECT_COMPANY', link.id, {
            projectId,
            organizationId: link.companyId,
            role: link.role,
        }, {
            actorCompanyId: actor.organizationId,
        });
        return updated;
    }
    async removeCompanyLink(projectId, companyLinkId, actor) {
        await this.access.assertProjectAccess(actor, projectId);
        const link = await this.db.projectCompany.findUnique({
            where: { id: companyLinkId },
        });
        if (!link || link.projectId !== projectId) {
            throw new common_1.NotFoundException('Project-company link not found');
        }
        if (!this.access.isSuperAdmin(actor)) {
            const project = await this.db.project.findUnique({
                where: { id: projectId },
                select: {
                    epcOrganizationId: true,
                    initiatedByCompanyId: true,
                },
            });
            const isCreatorOrg = project?.epcOrganizationId ===
                actor.organizationId ||
                project?.initiatedByCompanyId ===
                    actor.organizationId;
            const holdsInitiatorLink = (await this.db.projectCompany.findFirst({
                where: {
                    projectId,
                    companyId: actor.organizationId,
                    role: 'INITIATOR',
                    isActive: true,
                },
                select: { id: true },
            })) !== null;
            if (!isCreatorOrg && !holdsInitiatorLink) {
                throw new common_1.ForbiddenException('Only the initiating organization may unlink companies');
            }
        }
        await this.db.projectCompany.delete({
            where: { id: companyLinkId },
        });
        await this.activityLogsService.log(actor.id, 'PROJECT_COMPANY_REMOVED', 'PROJECT_COMPANY', link.id, {
            projectId,
            organizationId: link.companyId,
            role: link.role,
        }, {
            actorCompanyId: actor.organizationId,
        });
        return { removed: true };
    }
    async assignUserRole(projectId, dto, actor) {
        await this.access.assertProjectAccess(actor, projectId);
        const targetUser = await this.db.user.findUnique({
            where: { id: dto.userId },
            select: {
                id: true,
                organizationId: true,
                firstName: true,
                lastName: true,
            },
        });
        if (!targetUser) {
            throw new common_1.NotFoundException('User not found');
        }
        const partyProject = await this.db.project.findFirst({
            where: {
                id: projectId,
                OR: [
                    {
                        epcOrganizationId: targetUser.organizationId,
                    },
                    {
                        geotechOrganizationId: targetUser.organizationId,
                    },
                    {
                        initiatedByCompanyId: targetUser.organizationId,
                    },
                    {
                        projectCompanies: {
                            some: {
                                companyId: targetUser.organizationId,
                                isActive: true,
                                inviteAcceptedAt: { not: null },
                            },
                        },
                    },
                ],
            },
            select: { id: true },
        });
        if (!partyProject) {
            throw new common_1.BadRequestException("User's organization is not linked to this project");
        }
        const role = await this.db.role.findUnique({
            where: { code: dto.projectRole },
            select: { id: true, code: true },
        });
        if (!role) {
            throw new common_1.BadRequestException(`Unknown role code: ${dto.projectRole}`);
        }
        await this.db.userProjectRole.updateMany({
            where: {
                userId: dto.userId,
                projectId,
                roleId: { not: role.id },
                revokedAt: null,
            },
            data: { revokedAt: new Date() },
        });
        const assignment = await this.db.userProjectRole.upsert({
            where: {
                userId_projectId_companyId_roleId: {
                    userId: dto.userId,
                    projectId,
                    companyId: targetUser.organizationId,
                    roleId: role.id,
                },
            },
            create: {
                userId: dto.userId,
                projectId,
                companyId: targetUser.organizationId,
                roleId: role.id,
                assignedByUserId: actor.id,
            },
            update: {
                revokedAt: null,
                assignedByUserId: actor.id,
                assignedAt: new Date(),
            },
            include: {
                role: {
                    select: {
                        id: true,
                        code: true,
                        name: true,
                    },
                },
            },
        });
        await this.activityLogsService.log(actor.id, 'PROJECT_ROLE_ASSIGNED', 'USER_PROJECT_ROLE', assignment.id, {
            projectId,
            userId: dto.userId,
            roleCode: role.code,
        }, {
            actorCompanyId: actor.organizationId,
        });
        return assignment;
    }
    async getUserRoles(projectId, actor) {
        await this.access.assertProjectAccess(actor, projectId);
        return this.db.userProjectRole.findMany({
            where: {
                projectId,
                revokedAt: null,
            },
            include: {
                user: {
                    select: {
                        id: true,
                        firstName: true,
                        lastName: true,
                        employeeCode: true,
                    },
                },
                role: {
                    select: {
                        id: true,
                        code: true,
                        name: true,
                    },
                },
                company: {
                    select: {
                        id: true,
                        name: true,
                    },
                },
            },
            orderBy: { assignedAt: 'desc' },
        });
    }
};
exports.ProjectsService = ProjectsService;
exports.ProjectsService = ProjectsService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [database_service_1.DatabaseService,
        activity_logs_service_1.ActivityLogsService,
        project_access_service_1.ProjectAccessService])
], ProjectsService);
//# sourceMappingURL=projects.service.js.map