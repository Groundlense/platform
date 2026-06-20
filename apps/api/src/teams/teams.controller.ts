import { Body, Controller, Get, Param, Post, Delete, UseGuards } from '@nestjs/common';

import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';

import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

import { CurrentUser } from '../auth/decorators/current-user.decorator';

import { TeamsService } from './teams.service';

import { CreateTeamDto } from './dto/create-team.dto';

import { AddTeamMemberDto } from './dto/add-team-member.dto';

@ApiTags('Teams')
@ApiBearerAuth()
@Controller()
@UseGuards(JwtAuthGuard)
export class TeamsController {
  constructor(private readonly teamsService: TeamsService) {}

  @Post('organizations/:organizationId/teams')
  createTeam(
    @Param('organizationId')
    organizationId: string,

    @Body()
    dto: CreateTeamDto,

    @CurrentUser() user: any,
  ) {
    return this.teamsService.createTeam(organizationId, dto, user);
  }

  @Get('organizations/:organizationId/teams')
  getTeams(
    @Param('organizationId')
    organizationId: string,

    @CurrentUser() user: any,
  ) {
    return this.teamsService.getTeams(organizationId, user);
  }

  @Post('teams/:teamId/members')
  addMember(
    @Param('teamId')
    teamId: string,

    @Body()
    dto: AddTeamMemberDto,

    @CurrentUser() user: any,
  ) {
    return this.teamsService.addMember(teamId, dto.userId, user);
  }

  @Get('teams/:teamId')
  getTeam(
    @Param('teamId')
    teamId: string,

    @CurrentUser() user: any,
  ) {
    return this.teamsService.getTeam(teamId, user);
  }
  @Get('teams/:teamId/dashboard')
  getDashboard(
    @Param('teamId')
    teamId: string,

    @CurrentUser() user: any,
  ) {
    return this.teamsService.getDashboard(teamId, user);
  }

  @Delete('teams/:teamId')
  deleteTeam(
    @Param('teamId')
    teamId: string,

    @CurrentUser() user: any,
  ) {
    return this.teamsService.deleteTeam(teamId, user);
  }
}

