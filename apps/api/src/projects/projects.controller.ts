import {
  Body,
  Controller,
  Get,
  Post,
  UseGuards,
} from '@nestjs/common';

import { ProjectsService } from './projects.service';

import { CreateProjectDto } from './dto/create-project.dto';

import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

import { CurrentUser } from '../auth/decorators/current-user.decorator';

import { AddProjectMemberDto } from './dto/add-project-member.dto';

import { Param } from '@nestjs/common';

import {
  ApiBearerAuth,
  ApiTags,
} from '@nestjs/swagger';

@ApiTags('Projects')
@ApiBearerAuth()
@Controller('projects')
@UseGuards(JwtAuthGuard)
export class ProjectsController {
  constructor(
    private readonly projectsService: ProjectsService,
  ) {}

  @Post()
  create(
    @Body() dto: CreateProjectDto,
    @CurrentUser() user: any,
  ) {
    return this.projectsService.create(
      dto,
      user.id,
      user.organizationId,
    );
  }

  @Get()
  findAll() {
    return this.projectsService.findAll();
  }

  @Post(':projectId/members')
addMember(
  @Param('projectId')
  projectId: string,

  @Body()
  dto: AddProjectMemberDto,
) {
  return this.projectsService.addMember(
    projectId,
    dto.userId,
  );
}

@Get(':projectId/members')
getMembers(
  @Param('projectId')
  projectId: string,
) {
  return this.projectsService.getMembers(
    projectId,
  );
}

@Get('/my-projects')
getMyProjects(
  @CurrentUser() user: any,
) {
  return this.projectsService.getMyProjects(
    user.id,
  );
}
}