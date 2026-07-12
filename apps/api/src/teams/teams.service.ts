import { Injectable, NotFoundException } from '@nestjs/common';

import { DatabaseService } from '../database/database.service';

import { ProjectAccessService } from '../common/access/project-access.service';

import { CreateTeamDto } from './dto/create-team.dto';

const TEAM_MEMBER_USER_SELECT = {
  id: true,
  firstName: true,
  lastName: true,
  employeeCode: true,
  email: true,
  mobile: true,
  mobileVerified: true,
  status: true,
  designation: true,
  userType: true,
  preferredLanguage: true,
} as const;

@Injectable()
export class TeamsService {
  constructor(
    private readonly db: DatabaseService,
    private readonly access: ProjectAccessService,
  ) {}

  private async assertTeamAccess(actor: any, teamId: string) {
    const team = await this.db.team.findUnique({
      where: { id: teamId },
      select: { id: true, organizationId: true },
    });

    if (!team) {
      throw new NotFoundException('Team not found');
    }

    this.access.assertSameOrganization(actor, team.organizationId);

    return team;
  }

  async createTeam(organizationId: string, dto: CreateTeamDto, actor: any) {
    this.access.assertSameOrganization(actor, organizationId);

    return this.db.team.create({
      data: {
        organizationId,
        projectId: dto.projectId,

        code: dto.code,
        name: dto.name,

        description: dto.description,
      },
    });
  }

  async getTeams(organizationId: string, projectId: string | undefined, actor: any) {
    this.access.assertSameOrganization(actor, organizationId);

    return this.db.team.findMany({
      where: {
        organizationId,
        ...(projectId ? { projectId } : {}),
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

  async addMember(teamId: string, userId: string, actor: any) {
    await this.assertTeamAccess(actor, teamId);

    const existing = await this.db.teamMember.findFirst({
      where: { teamId, userId },
    });

    if (existing) {
      return existing;
    }

    return this.db.teamMember.create({
      data: {
        teamId,
        userId,
      },
    });
  }

  async getTeam(teamId: string, actor: any) {
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

  async getDashboard(teamId: string, actor: any) {
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

  async deleteTeam(teamId: string, actor: any) {
    await this.assertTeamAccess(actor, teamId);

    // Unassign all associated boreholes
    await this.db.borehole.updateMany({
      where: { teamId },
      data: { teamId: null },
    });

    // Delete team memberships
    await this.db.teamMember.deleteMany({
      where: { teamId },
    });

    // Delete the team record itself
    return this.db.team.delete({
      where: { id: teamId },
    });
  }

  async removeMember(teamId: string, userId: string, actor: any) {
    await this.assertTeamAccess(actor, teamId);

    await this.db.teamMember.deleteMany({
      where: {
        teamId,
        userId,
      },
    });

    return { success: true };
  }
}

