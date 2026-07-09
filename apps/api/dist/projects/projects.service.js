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
const notifications_service_1 = require("../notifications/notifications.service");
const email_helper_1 = require("../common/email.helper");
let ProjectsService = class ProjectsService {
    db;
    activityLogsService;
    access;
    notificationsService;
    constructor(db, activityLogsService, access, notificationsService) {
        this.db = db;
        this.activityLogsService = activityLogsService;
        this.access = access;
        this.notificationsService = notificationsService;
    }
    async create(dto, userId, organizationId) {
        let epcOrgId = null;
        let geotechOrgId = null;
        const callerOrg = await this.db.organization.findUnique({
            where: { id: organizationId },
        });
        if (callerOrg) {
            if (callerOrg.type === 'EPC_CONTRACTOR') {
                epcOrgId = organizationId;
            }
            else if (callerOrg.type === 'GEOTECH_CONTRACTOR') {
                geotechOrgId = organizationId;
            }
        }
        let partnerUser = null;
        let partnerEmail = null;
        if (dto.partnerSearchQuery) {
            const query = dto.partnerSearchQuery.trim();
            partnerUser = await this.db.user.findFirst({
                where: {
                    OR: [
                        { email: query },
                        { employeeCode: query },
                    ],
                },
            });
            if (!partnerUser && query.includes('@')) {
                partnerEmail = query;
            }
        }
        const project = await this.db.project.create({
            data: {
                projectCode: dto.projectCode,
                name: dto.name,
                description: dto.description,
                state: dto.state || null,
                tenderId: dto.tenderId || null,
                targetCompletionDate: dto.targetCompletionDate ? new Date(dto.targetCompletionDate) : null,
                startDate: dto.startDate ? new Date(dto.startDate) : null,
                endDate: dto.endDate ? new Date(dto.endDate) : null,
                createdByUserId: userId,
                epcOrganizationId: dto.epcOrganizationId || epcOrgId,
                geotechOrganizationId: dto.geotechOrganizationId || geotechOrgId,
            },
        });
        await this.db.projectMember.create({
            data: {
                projectId: project.id,
                userId: userId,
            },
        }).catch(() => { });
        const webUrl = process.env.WEB_URL || 'http://localhost:3000';
        if (partnerUser) {
            await this.db.projectJoinRequest.create({
                data: {
                    projectId: project.id,
                    organizationId: partnerUser.organizationId,
                    userId: partnerUser.id,
                    status: 'PENDING',
                    isInvitation: true,
                },
            }).catch(() => { });
            try {
                await this.notificationsService.create({
                    userId: partnerUser.id,
                    title: 'Project Link Invitation',
                    message: `Project '${project.name}' wants to link with your organization. Please approve to link.`,
                    type: 'JOIN_REQUEST',
                });
            }
            catch (err) {
                console.error('Failed to create notification:', err);
            }
            if (partnerUser.email) {
                const subject = `Invitation to link to project ${project.name} on GroundLense`;
                const text = `You have been invited to link your organization to project ${project.name} on GroundLense. View and approve it here: ${webUrl}/dashboard`;
                const html = `
          <div style="font-family: sans-serif; padding: 20px; color: #333;">
            <h2 style="color: #4f46e5;">Project Link Invitation</h2>
            <p>You have been invited to link your organization to project <strong>${project.name}</strong> on GroundLense.</p>
            <p>Please log in and approve the request from your dashboard to link the project:</p>
            <div style="margin: 30px 0;">
              <a href="${webUrl}/dashboard" style="background-color: #4f46e5; color: white; padding: 12px 24px; text-decoration: none; font-weight: bold; border-radius: 6px; display: inline-block;">
                View & Approve Request
              </a>
            </div>
          </div>
        `;
                void this.sendMail(partnerUser.email, subject, text, html);
            }
        }
        else if (partnerEmail) {
            await this.db.projectInvitation.upsert({
                where: {
                    projectId_email: {
                        projectId: project.id,
                        email: partnerEmail,
                    },
                },
                create: {
                    projectId: project.id,
                    email: partnerEmail,
                },
                update: {},
            });
            const subject = `Invitation to join project ${project.name} on GroundLense`;
            const text = `You have been invited to join project ${project.name} on GroundLense. Create an account here: ${webUrl}/login?register=true&email=${encodeURIComponent(partnerEmail)}&projectId=${project.id}`;
            const html = `
        <div style="font-family: sans-serif; padding: 20px; color: #333;">
          <h2 style="color: #4f46e5;">Invitation to join project on GroundLense</h2>
          <p>You have been invited to join the project <strong>${project.name}</strong> on GroundLense.</p>
          <p>Please click the button below to create an account, register your company, and access the project:</p>
          <div style="margin: 30px 0;">
            <a href="${webUrl}/login?register=true&email=${encodeURIComponent(partnerEmail)}&projectId=${project.id}" style="background-color: #4f46e5; color: white; padding: 12px 24px; text-decoration: none; font-weight: bold; border-radius: 6px; display: inline-block;">
              Create Account & Join Project
            </a>
          </div>
        </div>
      `;
            void this.sendMail(partnerEmail, subject, text, html);
        }
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
                initiatedByCompany: true,
                billingCompany: true,
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
            const boreholeStatusCounts = Object.fromEntries(BOREHOLE_STATUSES.map((status) => [status, counts[status] ?? 0]));
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
        const existing = await this.db.projectMember.findFirst({
            where: { projectId, userId },
        });
        if (existing) {
            return existing;
        }
        const membership = await this.db.projectMember.create({
            data: {
                projectId,
                userId,
            },
        });
        await this.db.notification.create({
            data: {
                userId,
                title: 'New Project Assignment',
                message: 'you have been assigned new project',
                type: 'PROJECT_ASSIGNMENT',
            },
        });
        return membership;
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
        const actor = await this.db.user.findUnique({
            where: { id: userId },
            include: {
                roles: {
                    include: {
                        role: true,
                    },
                },
            },
        });
        if (!actor)
            return [];
        const actorFormatted = {
            id: actor.id,
            organizationId: actor.organizationId,
            roles: actor.roles.map((ur) => ur.role.code),
        };
        const directMemberships = await this.db.projectMember.findMany({
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
        const allScopedProjects = await this.db.project.findMany({
            where: this.access.projectScopeWhere(actorFormatted),
            include: {
                epcOrganization: true,
                geotechOrganization: true,
            },
        });
        const directProjectIds = new Set(directMemberships.map(m => m.projectId));
        const extraMemberships = allScopedProjects
            .filter(p => !directProjectIds.has(p.id))
            .map(p => ({
            id: `virtual-${p.id}`,
            projectId: p.id,
            userId,
            createdAt: new Date(),
            project: p,
        }));
        return [...directMemberships, ...extraMemberships];
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
                inviteAcceptedAt: isSelfLink ? new Date() : null,
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
        if (link.inviteAcceptedAt !== null || !link.isActive) {
            throw new common_1.ConflictException('Invitation has already been responded to');
        }
        const updated = await this.db.projectCompany.update({
            where: { id: companyLinkId },
            data: accept ? { inviteAcceptedAt: new Date() } : { isActive: false },
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
            const isCreatorOrg = project?.epcOrganizationId === actor.organizationId ||
                project?.initiatedByCompanyId === actor.organizationId;
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
    async globalSearch(query, user) {
        const trimmed = query.trim();
        const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(trimmed);
        const projects = await this.db.project.findMany({
            where: {
                OR: [
                    ...(isUuid ? [{ id: trimmed }] : []),
                    { projectCode: { equals: trimmed, mode: 'insensitive' } },
                    { epcOrganization: { gstin: { equals: trimmed, mode: 'insensitive' } } },
                    { geotechOrganization: { gstin: { equals: trimmed, mode: 'insensitive' } } },
                ],
            },
            include: {
                epcOrganization: true,
                geotechOrganization: true,
            },
        });
        const result = [];
        for (const project of projects) {
            const hasAccess = await this.access.canAccessProject(user, project.id);
            result.push({
                ...project,
                hasAccess,
            });
        }
        return result;
    }
    async createJoinRequest(projectId, user) {
        const project = await this.db.project.findUnique({
            where: { id: projectId },
        });
        if (!project) {
            throw new common_1.NotFoundException('Project not found');
        }
        const existing = await this.db.projectJoinRequest.findUnique({
            where: {
                projectId_organizationId: {
                    projectId,
                    organizationId: user.organizationId,
                },
            },
        });
        if (existing) {
            if (existing.status === 'PENDING') {
                throw new common_1.ConflictException('A join request is already pending for this project');
            }
            else if (existing.status === 'APPROVED') {
                throw new common_1.ConflictException('Your organization is already joined to this project');
            }
        }
        const request = await this.db.projectJoinRequest.upsert({
            where: {
                projectId_organizationId: {
                    projectId,
                    organizationId: user.organizationId,
                },
            },
            create: {
                projectId,
                organizationId: user.organizationId,
                userId: user.id,
                status: 'PENDING',
                isInvitation: false,
            },
            update: {
                status: 'PENDING',
                userId: user.id,
                isInvitation: false,
            },
        });
        try {
            const requesterOrg = await this.db.organization.findUnique({
                where: { id: user.organizationId },
            });
            const message = `Organization '${requesterOrg?.name || 'Partner'}' is requesting to join project '${project.name}'.`;
            await this.notificationsService.create({
                userId: project.createdByUserId,
                title: 'Project Join Request',
                message,
                type: 'JOIN_REQUEST',
            });
        }
        catch (err) {
            console.error('Failed to notify project owner of join request:', err);
        }
        return request;
    }
    async getPendingProjectJoinRequests(user) {
        const organizationId = user.organizationId;
        const requests = await this.db.projectJoinRequest.findMany({
            where: {
                status: 'PENDING',
                OR: [
                    {
                        project: {
                            OR: [
                                { createdBy: { organizationId } },
                                { epcOrganizationId: organizationId },
                                { geotechOrganizationId: organizationId },
                            ],
                        },
                    },
                    {
                        organizationId,
                    },
                ],
            },
            include: {
                project: {
                    include: {
                        createdBy: {
                            select: {
                                id: true,
                                firstName: true,
                                lastName: true,
                                email: true,
                                organizationId: true,
                            }
                        }
                    }
                },
                organization: true,
                user: {
                    select: {
                        id: true,
                        firstName: true,
                        lastName: true,
                        email: true,
                        organizationId: true,
                    },
                },
            },
            orderBy: {
                createdAt: 'desc',
            },
        });
        return requests.filter((req) => {
            if (req.isInvitation) {
                return req.organizationId === organizationId;
            }
            else {
                const projectCreatorOrgId = req.project.createdBy?.organizationId;
                const isMyOrgOwner = req.project.epcOrganizationId === organizationId ||
                    req.project.geotechOrganizationId === organizationId ||
                    projectCreatorOrgId === organizationId;
                return isMyOrgOwner && req.organizationId !== organizationId;
            }
        });
    }
    async approveProjectJoinRequest(requestId, user) {
        const request = await this.db.projectJoinRequest.findUnique({
            where: { id: requestId },
            include: {
                project: true,
                organization: true,
            },
        });
        if (!request) {
            throw new common_1.NotFoundException('Join request not found');
        }
        const callerOrgId = user.organizationId;
        const project = request.project;
        let isAllowed = false;
        if (request.isInvitation) {
            isAllowed = request.organizationId === callerOrgId;
        }
        else {
            const projectCreator = await this.db.user.findUnique({ where: { id: project.createdByUserId } });
            const isOwner = project.epcOrganizationId === callerOrgId ||
                project.geotechOrganizationId === callerOrgId ||
                projectCreator?.organizationId === callerOrgId;
            isAllowed = isOwner;
        }
        if (!isAllowed && !this.access.isSuperAdmin(user)) {
            throw new common_1.ForbiddenException('You do not have permission to approve this request');
        }
        const partnerType = request.organization.type;
        const updateData = {};
        if (partnerType === 'GEOTECH_CONTRACTOR') {
            updateData.geotechOrganizationId = request.organizationId;
        }
        else if (partnerType === 'EPC_CONTRACTOR') {
            updateData.epcOrganizationId = request.organizationId;
        }
        await this.db.$transaction([
            this.db.project.update({
                where: { id: project.id },
                data: updateData,
            }),
            this.db.projectJoinRequest.update({
                where: { id: requestId },
                data: { status: 'APPROVED' },
            }),
            this.db.projectMember.upsert({
                where: {
                    projectId_userId: {
                        projectId: project.id,
                        userId: request.userId,
                    },
                },
                create: {
                    projectId: project.id,
                    userId: request.userId,
                },
                update: {},
            }),
        ]);
        await this.activityLogsService.log(user.id, 'PROJECT_JOIN_REQUEST_APPROVED', 'PROJECT', project.id, { requestId, organizationId: request.organizationId });
        return { success: true, message: 'Project join request approved successfully.' };
    }
    async rejectProjectJoinRequest(requestId, user) {
        const request = await this.db.projectJoinRequest.findUnique({
            where: { id: requestId },
            include: {
                project: true,
            },
        });
        if (!request) {
            throw new common_1.NotFoundException('Join request not found');
        }
        const callerOrgId = user.organizationId;
        const project = request.project;
        let isAllowed = false;
        if (request.isInvitation) {
            isAllowed = request.organizationId === callerOrgId;
        }
        else {
            const projectCreator = await this.db.user.findUnique({ where: { id: project.createdByUserId } });
            const isOwner = project.epcOrganizationId === callerOrgId ||
                project.geotechOrganizationId === callerOrgId ||
                projectCreator?.organizationId === callerOrgId;
            isAllowed = isOwner;
        }
        if (!isAllowed && !this.access.isSuperAdmin(user)) {
            throw new common_1.ForbiddenException('You do not have permission to reject this request');
        }
        await this.db.projectJoinRequest.update({
            where: { id: requestId },
            data: { status: 'REJECTED' },
        });
        return { success: true, message: 'Project join request rejected successfully.' };
    }
    async sendMail(email, subject, text, html) {
        await (0, email_helper_1.sendEmail)({
            to: email,
            subject,
            text,
            html,
        });
    }
};
exports.ProjectsService = ProjectsService;
exports.ProjectsService = ProjectsService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [database_service_1.DatabaseService,
        activity_logs_service_1.ActivityLogsService,
        project_access_service_1.ProjectAccessService,
        notifications_service_1.NotificationsService])
], ProjectsService);
//# sourceMappingURL=projects.service.js.map