import {
  Injectable,
  NotFoundException,
} from '@nestjs/common';

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
  status: true,
  designation: true,
} as const;

@Injectable()
export class TeamsService {
  constructor(
    private readonly db: DatabaseService,
    private readonly access: ProjectAccessService,
  ) {}

  private async assertTeamAccess(
    actor: any,
    teamId: string,
  ) {
    const team = await this.db.team.findUnique({
      where: { id: teamId },
      select: { id: true, organizationId: true },
    });

    if (!team) {
      throw new NotFoundException('Team not found');
    }

    this.access.assertSameOrganization(
      actor,
      team.organizationId,
    );

    return team;
  }

  async createTeam(
    organizationId: string,
    dto: CreateTeamDto,
    actor: any,
  ) {
    this.access.assertSameOrganization(
      actor,
      organizationId,
    );

    return this.db.team.create({
      data: {
        organizationId,

        code: dto.code,
        name: dto.name,

        description:
          dto.description,
      },
    });
  }

  async getTeams(
    organizationId: string,
    actor: any,
  ) {
    this.access.assertSameOrganization(
      actor,
      organizationId,
    );

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

  async addMember(
    teamId: string,
    userId: string,
    actor: any,
  ) {
    await this.assertTeamAccess(actor, teamId);

    return this.db.teamMember.create({
      data: {
        teamId,
        userId,
      },
    });
  }

  async getTeam(
    teamId: string,
    actor: any,
  ) {
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

  async getDashboard(
    teamId: string,
    actor: any,
  ) {
    await this.assertTeamAccess(actor, teamId);

    const team =
      await this.db.team.findUnique({
        where: {
          id: teamId,
        },

        include: {
          members: true,

          boreholes: true,
        },
      });

    const boreholes =
      team?.boreholes ?? [];

    return {
      teamId: team?.id,

      teamName: team?.name,

      members:
        team?.members.length ?? 0,

      boreholes:
        boreholes.length,

      planned:
        boreholes.filter(
          (b) =>
            b.status ===
            'PLANNED',
        ).length,

      inProgress:
        boreholes.filter(
          (b) =>
            b.status ===
            'IN_PROGRESS',
        ).length,

      completed:
        boreholes.filter(
          (b) =>
            b.status ===
            'COMPLETED',
        ).length,

      abandoned:
        boreholes.filter(
          (b) =>
            b.status ===
            'ABANDONED',
        ).length,
    };
  }
}
