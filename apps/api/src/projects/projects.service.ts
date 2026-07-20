import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';

import { DatabaseService } from '../database/database.service';
import { ActivityLogsService } from '../activity-logs/activity-logs.service';
import { ProjectAccessService } from '../common/access/project-access.service';
import { CreateProjectDto } from './dto/create-project.dto';
import { UpdateProjectDto } from './dto/update-project.dto';
import { InviteProjectCompanyDto } from './dto/invite-project-company.dto';
import { AssignProjectRoleDto } from './dto/assign-project-role.dto';
import { NotificationsService } from '../notifications/notifications.service';
import { sendEmail } from '../common/email.helper';

@Injectable()
export class ProjectsService {
  constructor(
    private readonly db: DatabaseService,
    private readonly activityLogsService: ActivityLogsService,
    private readonly access: ProjectAccessService,
    private readonly notificationsService: NotificationsService,
  ) {}

  async create(dto: CreateProjectDto, userId: string, organizationId: string) {
    let epcOrgId: string | null = null;
    let geotechOrgId: string | null = null;
    
    const callerOrg = await this.db.organization.findUnique({
      where: { id: organizationId },
    });
    if (callerOrg) {
      if (callerOrg.type === 'EPC_CONTRACTOR') {
        epcOrgId = organizationId;
      } else if (callerOrg.type === 'GEOTECH_CONTRACTOR') {
        geotechOrgId = organizationId;
      }
    }

    let partnerUser: any = null;
    let partnerEmail: string | null = null;
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

    // Add creator to project members
    await this.db.projectMember.create({
      data: {
        projectId: project.id,
        userId: userId,
      },
    }).catch(() => {});

    // Notify/email partner or handle invitation
    const webUrl = process.env.WEB_URL || 'http://localhost:3000';
    
    if (partnerUser) {
      // Instead of directly mapping partner organization or adding to project members,
      // create a PENDING ProjectJoinRequest (invitation)
      await this.db.projectJoinRequest.create({
        data: {
          projectId: project.id,
          organizationId: partnerUser.organizationId,
          userId: partnerUser.id,
          status: 'PENDING',
          isInvitation: true,
        },
      }).catch(() => {});

      try {
        await this.notificationsService.create({
          userId: partnerUser.id,
          title: 'Project Link Invitation',
          message: `Project '${project.name}' wants to link with your organization. Please approve to link.`,
          type: 'JOIN_REQUEST',
        });
      } catch (err) {
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
    } else if (partnerEmail) {
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

    await this.activityLogsService.log(
      userId,
      'PROJECT_CREATED',
      'PROJECT',
      project.id,
      {
        projectCode: project.projectCode,
        projectName: project.name,
      },
    );

    return project;
  }

  /**
   * Project Details card on the Setup tab — name/state/dates. Frozen once
   * fieldwork has started, same rule as boreholes/members (SUPER_ADMIN
   * bypasses). endDate and targetCompletionDate are kept in sync since the
   * web UI only exposes a single "Expected Completion" field for both.
   */
  async update(projectId: string, dto: UpdateProjectDto, actor: any) {
    await this.access.assertProjectAccess(actor, projectId);

    if (!this.access.isSuperAdmin(actor)) {
      const started = await this.db.borehole.count({
        where: { projectId, status: { not: 'PLANNED' } },
      });
      if (started > 0) {
        throw new ForbiddenException(
          'Project setup is locked — fieldwork has already started',
        );
      }
    }

    const data: Record<string, unknown> = {};
    if (dto.name !== undefined) data.name = dto.name;
    if (dto.state !== undefined) data.state = dto.state;
    if (dto.startDate !== undefined) {
      data.startDate = dto.startDate ? new Date(dto.startDate) : null;
    }
    if (dto.endDate !== undefined) {
      const endDate = dto.endDate ? new Date(dto.endDate) : null;
      data.endDate = endDate;
      data.targetCompletionDate = endDate;
    }

    const project = await this.db.project.update({
      where: { id: projectId },
      data,
    });

    await this.activityLogsService.log(
      actor.id,
      'PROJECT_UPDATED',
      'PROJECT',
      project.id,
      data,
    );

    return project;
  }

  async findAll(user: any) {
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

    // One grouped query for all visible projects instead of a
    // per-project count round-trip.
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
    ] as const;

    const countsByProject = new Map<string, Record<string, number>>();

    for (const row of grouped) {
      const counts = countsByProject.get(row.projectId) ?? {};
      counts[row.status] = row._count._all;
      countsByProject.set(row.projectId, counts);
    }

    return projects.map((project) => {
      const counts = countsByProject.get(project.id) ?? {};

      const boreholeStatusCounts = Object.fromEntries(
        BOREHOLE_STATUSES.map((status) => [status, counts[status] ?? 0]),
      );

      const totalBoreholes = Object.values(boreholeStatusCounts).reduce(
        (sum, n) => sum + n,
        0,
      );

      return {
        ...project,
        boreholeStatusCounts,
        totalBoreholes,
      };
    });
  }

  // Exact project-code lookup for the mobile app. Always answers (no
  // 403/404) so the client can render the amber "not found" vs red
  // "not assigned" states.
  async searchByCode(code: string, user: any) {
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

  async addMember(projectId: string, userId: string, actor: any) {
    await this.access.assertProjectAccess(actor, projectId);

    // Unlike boreholes/project-detail edits, crew staffing (adding a
    // worker/member) stays open after fieldwork starts — new hires still
    // need to join teams working still-PLANNED boreholes. Per-borehole
    // reassignment remains frozen via BoreholesService#assign.
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

    // Send a message/notification to the assigned user
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

  async getMembers(projectId: string, actor: any) {
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

  async getMyProjects(userId: string) {
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

    if (!actor) return [];

    const actorFormatted = {
      id: actor.id,
      organizationId: actor.organizationId,
      roles: actor.roles.map((ur: any) => ur.role.code),
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

  // ==========================================
  // Project-company linking (Two-Level RBAC)
  // ==========================================

  /** Invite/link a company to a project (project_companies). */
  async inviteCompany(
    projectId: string,
    dto: InviteProjectCompanyDto,
    actor: any,
  ) {
    await this.access.assertProjectAccess(actor, projectId);

    const organization = await this.db.organization.findUnique({
      where: { id: dto.organizationId },
      select: { id: true, name: true },
    });

    if (!organization) {
      throw new NotFoundException('Organization not found');
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
      throw new ConflictException('Company is already linked to this project');
    }

    // Inviting your own organization needs no acceptance handshake.
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

    await this.activityLogsService.log(
      actor.id,
      'PROJECT_COMPANY_INVITED',
      'PROJECT_COMPANY',
      link.id,
      {
        projectId,
        organizationId: dto.organizationId,
        organizationName: organization.name,
        role: dto.role,
      },
      {
        actorCompanyId: actor.organizationId,
      },
    );

    return link;
  }

  /** Companies linked (or invited) to a project. */
  async getCompanies(projectId: string, actor: any) {
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

  /**
   * Accept/decline an invitation. Only users of the invited organization
   * may respond — deliberately NOT behind assertProjectAccess, since a
   * pending invitee has no project scope until they accept.
   */
  async respondToCompanyInvite(
    projectId: string,
    companyLinkId: string,
    accept: boolean,
    actor: any,
  ) {
    const link = await this.db.projectCompany.findUnique({
      where: { id: companyLinkId },
    });

    if (!link || link.projectId !== projectId) {
      throw new NotFoundException('Project-company link not found');
    }

    if (
      actor.organizationId !== link.companyId &&
      !this.access.isSuperAdmin(actor)
    ) {
      throw new ForbiddenException(
        'Only the invited organization may respond to this invitation',
      );
    }

    if (link.inviteAcceptedAt !== null || !link.isActive) {
      throw new ConflictException('Invitation has already been responded to');
    }

    const updated = await this.db.projectCompany.update({
      where: { id: companyLinkId },
      data: accept ? { inviteAcceptedAt: new Date() } : { isActive: false },
    });

    await this.activityLogsService.log(
      actor.id,
      accept
        ? 'PROJECT_COMPANY_INVITE_ACCEPTED'
        : 'PROJECT_COMPANY_INVITE_DECLINED',
      'PROJECT_COMPANY',
      link.id,
      {
        projectId,
        organizationId: link.companyId,
        role: link.role,
      },
      {
        actorCompanyId: actor.organizationId,
      },
    );

    return updated;
  }

  /** Unlink a company; restricted to the project's initiator/creator org. */
  async removeCompanyLink(
    projectId: string,
    companyLinkId: string,
    actor: any,
  ) {
    await this.access.assertProjectAccess(actor, projectId);

    const link = await this.db.projectCompany.findUnique({
      where: { id: companyLinkId },
    });

    if (!link || link.projectId !== projectId) {
      throw new NotFoundException('Project-company link not found');
    }

    if (!this.access.isSuperAdmin(actor)) {
      const project = await this.db.project.findUnique({
        where: { id: projectId },
        select: {
          epcOrganizationId: true,
          initiatedByCompanyId: true,
        },
      });

      const isCreatorOrg =
        project?.epcOrganizationId === actor.organizationId ||
        project?.initiatedByCompanyId === actor.organizationId;

      const holdsInitiatorLink =
        (await this.db.projectCompany.findFirst({
          where: {
            projectId,
            companyId: actor.organizationId,
            role: 'INITIATOR',
            isActive: true,
          },
          select: { id: true },
        })) !== null;

      if (!isCreatorOrg && !holdsInitiatorLink) {
        throw new ForbiddenException(
          'Only the initiating organization may unlink companies',
        );
      }
    }

    await this.db.projectCompany.delete({
      where: { id: companyLinkId },
    });

    await this.activityLogsService.log(
      actor.id,
      'PROJECT_COMPANY_REMOVED',
      'PROJECT_COMPANY',
      link.id,
      {
        projectId,
        organizationId: link.companyId,
        role: link.role,
      },
      {
        actorCompanyId: actor.organizationId,
      },
    );

    return { removed: true };
  }

  // ==========================================
  // Project-level role assignment (Two-Level RBAC)
  // ==========================================

  /** Assign (or replace) a user's project-level role. */
  async assignUserRole(
    projectId: string,
    dto: AssignProjectRoleDto,
    actor: any,
  ) {
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
      throw new NotFoundException('User not found');
    }

    // The target's organization must be a party to the project: an EPC
    // or geotech org, or linked via an accepted project_companies row.
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
      throw new BadRequestException(
        "User's organization is not linked to this project",
      );
    }

    const role = await this.db.role.findUnique({
      where: { code: dto.projectRole },
      select: { id: true, code: true },
    });

    if (!role) {
      throw new BadRequestException(`Unknown role code: ${dto.projectRole}`);
    }

    // Replace semantics: revoke any other active assignment for this
    // user on this project, then (re)activate the requested one.
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

    await this.activityLogsService.log(
      actor.id,
      'PROJECT_ROLE_ASSIGNED',
      'USER_PROJECT_ROLE',
      assignment.id,
      {
        projectId,
        userId: dto.userId,
        roleCode: role.code,
      },
      {
        actorCompanyId: actor.organizationId,
      },
    );

    return assignment;
  }

  /** Active project-level role assignments for a project. */
  async getUserRoles(projectId: string, actor: any) {
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

  async globalSearch(query: string, user: any) {
    const trimmed = query.trim();
    const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(trimmed);

    const projects = await this.db.project.findMany({
      where: {
        OR: [
          ...(isUuid ? [{ id: trimmed }] : []),
          { projectCode: { equals: trimmed, mode: 'insensitive' as const } },
          { epcOrganization: { gstin: { equals: trimmed, mode: 'insensitive' as const } } },
          { geotechOrganization: { gstin: { equals: trimmed, mode: 'insensitive' as const } } },
        ],
      },
      include: {
        epcOrganization: true,
        geotechOrganization: true,
      },
    });

    const result: any[] = [];
    for (const project of projects) {
      const hasAccess = await this.access.canAccessProject(user, project.id);
      result.push({
        ...project,
        hasAccess,
      });
    }
    return result;
  }

  async createJoinRequest(projectId: string, user: any) {
    const project = await this.db.project.findUnique({
      where: { id: projectId },
    });
    if (!project) {
      throw new NotFoundException('Project not found');
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
        throw new ConflictException('A join request is already pending for this project');
      } else if (existing.status === 'APPROVED') {
        throw new ConflictException('Your organization is already joined to this project');
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
    } catch (err) {
      console.error('Failed to notify project owner of join request:', err);
    }

    return request;
  }

  async getPendingProjectJoinRequests(user: any) {
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
        // Invitation -> only show to the target organization (me)
        return req.organizationId === organizationId;
      } else {
        // Join Request -> only show to project owner (me)
        const projectCreatorOrgId = req.project.createdBy?.organizationId;
        const isMyOrgOwner =
          req.project.epcOrganizationId === organizationId ||
          req.project.geotechOrganizationId === organizationId ||
          projectCreatorOrgId === organizationId;
        
        return isMyOrgOwner && req.organizationId !== organizationId;
      }
    });
  }

  async approveProjectJoinRequest(requestId: string, user: any) {
    const request = await this.db.projectJoinRequest.findUnique({
      where: { id: requestId },
      include: {
        project: true,
        organization: true,
      },
    });

    if (!request) {
      throw new NotFoundException('Join request not found');
    }

    const callerOrgId = user.organizationId;
    const project = request.project;
    
    let isAllowed = false;
    if (request.isInvitation) {
      isAllowed = request.organizationId === callerOrgId;
    } else {
      const projectCreator = await this.db.user.findUnique({ where: { id: project.createdByUserId } });
      const isOwner =
        project.epcOrganizationId === callerOrgId ||
        project.geotechOrganizationId === callerOrgId ||
        projectCreator?.organizationId === callerOrgId;
      isAllowed = isOwner;
    }

    if (!isAllowed && !this.access.isSuperAdmin(user)) {
      throw new ForbiddenException('You do not have permission to approve this request');
    }

    const partnerType = request.organization.type;

    const updateData: any = {};
    if (partnerType === 'GEOTECH_CONTRACTOR') {
      updateData.geotechOrganizationId = request.organizationId;
    } else if (partnerType === 'EPC_CONTRACTOR') {
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

    await this.activityLogsService.log(
      user.id,
      'PROJECT_JOIN_REQUEST_APPROVED',
      'PROJECT',
      project.id,
      { requestId, organizationId: request.organizationId },
    );

    return { success: true, message: 'Project join request approved successfully.' };
  }

  async rejectProjectJoinRequest(requestId: string, user: any) {
    const request = await this.db.projectJoinRequest.findUnique({
      where: { id: requestId },
      include: {
        project: true,
      },
    });

    if (!request) {
      throw new NotFoundException('Join request not found');
    }

    const callerOrgId = user.organizationId;
    const project = request.project;
    
    let isAllowed = false;
    if (request.isInvitation) {
      isAllowed = request.organizationId === callerOrgId;
    } else {
      const projectCreator = await this.db.user.findUnique({ where: { id: project.createdByUserId } });
      const isOwner =
        project.epcOrganizationId === callerOrgId ||
        project.geotechOrganizationId === callerOrgId ||
        projectCreator?.organizationId === callerOrgId;
      isAllowed = isOwner;
    }

    if (!isAllowed && !this.access.isSuperAdmin(user)) {
      throw new ForbiddenException('You do not have permission to reject this request');
    }

    await this.db.projectJoinRequest.update({
      where: { id: requestId },
      data: { status: 'REJECTED' },
    });

    return { success: true, message: 'Project join request rejected successfully.' };
  }

  private async sendMail(email: string, subject: string, text: string, html: string): Promise<void> {
    await sendEmail({
      to: email,
      subject,
      text,
      html,
    });
  }
}
