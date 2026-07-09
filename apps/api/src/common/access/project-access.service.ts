import {
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { DatabaseService } from '../../database/database.service';

/**
 * Central org/project scoping per the ERD/RBAC spec: data is only visible
 * to members of the project or to users of the companies attached to it.
 */
@Injectable()
export class ProjectAccessService {
  constructor(private readonly db: DatabaseService) {}

  isSuperAdmin(user: any): boolean {
    return user?.roles?.includes('SUPER_ADMIN') ?? false;
  }

  /**
   * Prisma `where` filter limiting projects to those the user can see:
   * their organization is a party to the project, they are a member, or
   * — per the Two-Level RBAC spec — their company is linked through an
   * accepted project_companies invitation, or they hold an (unrevoked)
   * user_project_roles assignment on the project.
   */
  projectScopeWhere(user: any) {
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
        // Two-level RBAC: company linked to the project via an
        // accepted, active project_companies invitation.
        {
          projectCompanies: {
            some: {
              companyId: user.organizationId,
              isActive: true,
              inviteAcceptedAt: { not: null },
            },
          },
        },
        // Two-level RBAC: explicit per-project role assignment.
        {
          userProjectRoles: {
            some: {
              userId: user.id,
              revokedAt: null,
            },
          },
        },
        // Access via team assigned to a borehole in the project:
        {
          boreholes: {
            some: {
              team: {
                members: {
                  some: { userId: user.id },
                },
              },
            },
          },
        },
      ],
    };
  }

  async canAccessProject(user: any, projectId: string): Promise<boolean> {
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

  async assertProjectAccess(user: any, projectId: string) {
    const project = await this.db.project.findUnique({
      where: { id: projectId },
      select: { id: true },
    });

    if (!project) {
      throw new NotFoundException('Project not found');
    }

    if (!(await this.canAccessProject(user, projectId))) {
      throw new ForbiddenException('No access to this project');
    }
  }

  /** Asserts access via the borehole's parent project; returns the borehole. */
  async assertBoreholeAccess(user: any, boreholeId: string) {
    const borehole = await this.db.borehole.findUnique({
      where: { id: boreholeId },
    });

    if (!borehole) {
      throw new NotFoundException('Borehole not found');
    }

    if (!(await this.canAccessProject(user, borehole.projectId))) {
      throw new ForbiddenException('No access to this borehole');
    }

    return borehole;
  }

  /** Asserts access via the interval's parent borehole; returns the interval. */
  async assertIntervalAccess(user: any, intervalId: string) {
    const interval = await this.db.boreholeInterval.findUnique({
      where: { id: intervalId },
      include: {
        borehole: { select: { projectId: true } },
      },
    });

    if (!interval) {
      throw new NotFoundException('Interval not found');
    }

    if (!(await this.canAccessProject(user, interval.borehole.projectId))) {
      throw new ForbiddenException('No access to this interval');
    }

    return interval;
  }

  /**
   * Two-Level RBAC, level 2 (spec: "User opens a project → Load
   * user_project_roles → Filter actions by project_role").
   *
   * Returns the user's project-level role code for `projectId`:
   * - the Role.code of their active (unrevoked) UserProjectRole, if any;
   * - else 'COMPANY_PARTY' when their organization is a party to the
   *   project (EPC/geotech org, or an accepted project_companies link);
   * - else null (no project-level standing at all).
   *
   * Usage in feature services — combine with the company-level
   * permission check (PermissionsGuard) for fine-grained gating:
   *
   *   await this.access.assertProjectAccess(user, projectId);
   *   await this.access.assertProjectRole(user, projectId, [
   *     'GEOTECH_ENGINEER',
   *     'GEOTECH_MANAGER',
   *   ]);
   */
  async getProjectRole(user: any, projectId: string): Promise<string | null> {
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

  /**
   * Throws ForbiddenException unless the user's project-level role is in
   * `allowed`. SUPER_ADMIN bypasses, consistent with the rest of this
   * service.
   */
  async assertProjectRole(user: any, projectId: string, allowed: string[]) {
    if (this.isSuperAdmin(user)) {
      return;
    }

    const role = await this.getProjectRole(user, projectId);

    if (!role || !allowed.includes(role)) {
      throw new ForbiddenException(
        'Your project role does not permit this action',
      );
    }
  }

  assertSameOrganization(user: any, organizationId: string) {
    if (!this.isSuperAdmin(user) && user.organizationId !== organizationId) {
      throw new ForbiddenException('Resource belongs to another organization');
    }
  }
}
