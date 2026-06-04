import {
  Body,
  Controller,
  Get,
  Param,
  Post,
  UseGuards,
} from '@nestjs/common';

import {
  ApiBearerAuth,
  ApiTags,
} from '@nestjs/swagger';

import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

import { TeamsService } from './teams.service';

import { CreateTeamDto } from './dto/create-team.dto';

import { AddTeamMemberDto } from './dto/add-team-member.dto';

@ApiTags('Teams')
@ApiBearerAuth()
@Controller()
@UseGuards(JwtAuthGuard)
export class TeamsController {
  constructor(
    private readonly teamsService: TeamsService,
  ) {}

  @Post(
    'organizations/:organizationId/teams',
  )
  createTeam(
    @Param('organizationId')
    organizationId: string,

    @Body()
    dto: CreateTeamDto,
  ) {
    return this.teamsService.createTeam(
      organizationId,
      dto,
    );
  }

  @Get(
    'organizations/:organizationId/teams',
  )
  getTeams(
    @Param('organizationId')
    organizationId: string,
  ) {
    return this.teamsService.getTeams(
      organizationId,
    );
  }

  @Post(
    'teams/:teamId/members',
  )
  addMember(
    @Param('teamId')
    teamId: string,

    @Body()
    dto: AddTeamMemberDto,
  ) {
    return this.teamsService.addMember(
      teamId,
      dto.userId,
    );
  }

  @Get('teams/:teamId')
  getTeam(
    @Param('teamId')
    teamId: string,
  ) {
    return this.teamsService.getTeam(
      teamId,
    );
  }
  @Get(
  'teams/:teamId/dashboard',
)
getDashboard(
  @Param('teamId')
  teamId: string,
) {
  return this.teamsService.getDashboard(
    teamId,
  );
}
}