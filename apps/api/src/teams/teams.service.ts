import { Injectable } from '@nestjs/common';

import { DatabaseService } from '../database/database.service';

import { CreateTeamDto } from './dto/create-team.dto';

@Injectable()
export class TeamsService {
  constructor(
    private readonly db: DatabaseService,
  ) {}

  async createTeam(
    organizationId: string,
    dto: CreateTeamDto,
  ) {
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
  ) {
    return this.db.team.findMany({
      where: {
        organizationId,
      },
      orderBy: {
        code: 'asc',
      },
    });
  }

  async addMember(
    teamId: string,
    userId: string,
  ) {
    return this.db.teamMember.create({
      data: {
        teamId,
        userId,
      },
    });
  }

  async getTeam(
    teamId: string,
  ) {
    return this.db.team.findUnique({
      where: {
        id: teamId,
      },
      include: {
        members: {
          include: {
            user: true,
          },
        },
      },
    });
  }
}