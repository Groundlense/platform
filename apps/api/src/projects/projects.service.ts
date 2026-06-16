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

import { InviteProjectCompanyDto } from './dto/invite-project-company.dto';

import { AssignProjectRoleDto } from './dto/assign-project-role.dto';

@Injectable()
export class ProjectsService {
  constructor(
    private readonly db: DatabaseService,
    private readonly activityLogsService: ActivityLogsService,
    private readonly access: ProjectAccessService,
  ) {}

  async create(
    dto: CreateProjectDto,
    userId: string,
    organizationId: string,
  ) {
    const project =
      await this.db.project.create({
        data: {
          projectCode:
            dto.projectCode,

          name:
            dto.name,

          description:
            dto.description,

          startDate:
            dto.startDate
              ? new Date(
                  dto.startDate,
                )
              : null,

          endDate:
            dto.endDate
              ? new Date(
                  dto.endDate,
                )
              : null,

          createdByUserId:
            userId,

          epcOrganizationId:
            organizationId,

          geotechOrganizationId:
            dto.geotechOrganizationId,
        },
      });

    await this.activityLogsService.log(
      userId,
      'PROJECT_CREATED',
      'PROJECT',
      project.id,
      {
        projectCode:
          project.projectCode,
        projectName:
          project.name,
      },
    );

    return project;
  }

  async findAll(user: any) {
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

    const countsByProject = new Map<
      string,
      Record<string, number>
    >();

    for (const row of grouped) {
      const counts =
        countsByProject.get(row.projectId) ?? {};
      counts[row.status] = row._count._all;
      countsByProject.set(row.projectId, counts);
    }

    return projects.map((project) => {
      const counts =
        countsByProject.get(project.id) ?? {};

      const boreholeStatusCounts =
        Object.fromEntries(
          BOREHOLE_STATUSES.map((status) => [
            status,
            counts[status] ?? 0,
          ]),
        );

      const totalBoreholes = Object.values(
        boreholeStatusCounts,
      ).reduce((sum, n) => sum + n, 0);

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

    const hasAccess =
      await this.access.canAccessProject(
        user,
        project.id,
      );

    return {
      found: true,
      hasAccess,
      project,
    };
  }

  async addMember(
    projectId: string,
    userId: string,
    actor: any,
  ) {
    await this.access.assertProjectAccess(
      actor,
      projectId,
    );

    return this.db.projectMember.create({
      data: {
        projectId,
        userId,
      },
    });
  }

  async getMembers(
    projectId: string,
    actor: any,
  ) {
    await this.access.assertProjectAccess(
      actor,
      projectId,
    );

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

  async getMyProjects(
    userId: string,
  ) {
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

  // ==========================================
  // Project-company linking (Two-Level RBAC)
  // ==========================================

  /** Invite/link a company to a project (project_companies). */
  async inviteCompany(
    projectId: string,
    dto: InviteProjectCompanyDto,
    actor: any,
  ) {
    await this.access.assertProjectAccess(
      actor,
      projectId,
    );

    const organization =
      await this.db.organization.findUnique({
        where: { id: dto.organizationId },
        select: { id: true, name: true },
      });

    if (!organization) {
      throw new NotFoundException(
        'Organization not found',
      );
    }

    const existing =
      await this.db.projectCompany.findFirst({
        where: {
          projectId,
          companyId: dto.organizationId,
          isActive: true,
        },
        select: { id: true },
      });

    if (existing) {
      throw new ConflictException(
        'Company is already linked to this project',
      );
    }

    // Inviting your own organization needs no acceptance handshake.
    const isSelfLink =
      dto.organizationId === actor.organizationId;

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
  async getCompanies(
    projectId: string,
    actor: any,
  ) {
    await this.access.assertProjectAccess(
      actor,
      projectId,
    );

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
    const link =
      await this.db.projectCompany.findUnique({
        where: { id: companyLinkId },
      });

    if (!link || link.projectId !== projectId) {
      throw new NotFoundException(
        'Project-company link not found',
      );
    }

    if (
      actor.organizationId !== link.companyId &&
      !this.access.isSuperAdmin(actor)
    ) {
      throw new ForbiddenException(
        'Only the invited organization may respond to this invitation',
      );
    }

    if (
      link.inviteAcceptedAt !== null ||
      !link.isActive
    ) {
      throw new ConflictException(
        'Invitation has already been responded to',
      );
    }

    const updated =
      await this.db.projectCompany.update({
        where: { id: companyLinkId },
        data: accept
          ? { inviteAcceptedAt: new Date() }
          : { isActive: false },
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
    await this.access.assertProjectAccess(
      actor,
      projectId,
    );

    const link =
      await this.db.projectCompany.findUnique({
        where: { id: companyLinkId },
      });

    if (!link || link.projectId !== projectId) {
      throw new NotFoundException(
        'Project-company link not found',
      );
    }

    if (!this.access.isSuperAdmin(actor)) {
      const project =
        await this.db.project.findUnique({
          where: { id: projectId },
          select: {
            epcOrganizationId: true,
            initiatedByCompanyId: true,
          },
        });

      const isCreatorOrg =
        project?.epcOrganizationId ===
          actor.organizationId ||
        project?.initiatedByCompanyId ===
          actor.organizationId;

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
    await this.access.assertProjectAccess(
      actor,
      projectId,
    );

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
    const partyProject =
      await this.db.project.findFirst({
        where: {
          id: projectId,
          OR: [
            {
              epcOrganizationId:
                targetUser.organizationId,
            },
            {
              geotechOrganizationId:
                targetUser.organizationId,
            },
            {
              initiatedByCompanyId:
                targetUser.organizationId,
            },
            {
              projectCompanies: {
                some: {
                  companyId:
                    targetUser.organizationId,
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
      throw new BadRequestException(
        `Unknown role code: ${dto.projectRole}`,
      );
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

    const assignment =
      await this.db.userProjectRole.upsert({
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
  async getUserRoles(
    projectId: string,
    actor: any,
  ) {
    await this.access.assertProjectAccess(
      actor,
      projectId,
    );

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
}