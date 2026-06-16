import {
  BadRequestException,
  Body,
  Controller,
  Delete,
  Get,
  Patch,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';

import { ProjectsService } from './projects.service';

import { CreateProjectDto } from './dto/create-project.dto';

import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

import { CurrentUser } from '../auth/decorators/current-user.decorator';

import { AddProjectMemberDto } from './dto/add-project-member.dto';

import { InviteProjectCompanyDto } from './dto/invite-project-company.dto';

import { RespondProjectCompanyDto } from './dto/respond-project-company.dto';

import { AssignProjectRoleDto } from './dto/assign-project-role.dto';

import { Param } from '@nestjs/common';

import {
  ApiBearerAuth,
  ApiTags,
} from '@nestjs/swagger';

import { Permissions } from '../auth/decorators/permissions.decorator';
import { PermissionsGuard } from '../auth/guards/permissions.guard';
@ApiTags('Projects')
@ApiBearerAuth()
@Controller('projects')
@UseGuards(JwtAuthGuard)

export class ProjectsController {
  constructor(
    private readonly projectsService: ProjectsService,
  ) {}

  @Permissions('PROJECT_CREATE')
  @UseGuards(
    JwtAuthGuard,
    PermissionsGuard,
  )
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
  findAll(
    @CurrentUser() user: any,
  ) {
    return this.projectsService.findAll(
      user,
    );
  }

  // Mobile project-code lookup: distinguishes "project does not exist"
  // (amber state) from "exists but not assigned to you" (red state).
  // Declared before any ':projectId' GET route so 'search' is not
  // captured as a path parameter.
  @Get('search')
  search(
    @Query('code') code: string,
    @CurrentUser() user: any,
  ) {
    if (!code) {
      throw new BadRequestException(
        'Query parameter "code" is required',
      );
    }

    return this.projectsService.searchByCode(
      code,
      user,
    );
  }

  @Post(':projectId/members')
addMember(
  @Param('projectId')
  projectId: string,

  @Body()
  dto: AddProjectMemberDto,

  @CurrentUser() user: any,
) {
  return this.projectsService.addMember(
    projectId,
    dto.userId,
    user,
  );
}

@Get(':projectId/members')
getMembers(
  @Param('projectId')
  projectId: string,

  @CurrentUser() user: any,
) {
  return this.projectsService.getMembers(
    projectId,
    user,
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

// ==========================================
// Project-company linking (Two-Level RBAC)
// ==========================================

@Permissions('PROJECT_EDIT')
@UseGuards(JwtAuthGuard, PermissionsGuard)
@Post(':projectId/companies')
inviteCompany(
  @Param('projectId') projectId: string,

  @Body() dto: InviteProjectCompanyDto,

  @CurrentUser() user: any,
) {
  return this.projectsService.inviteCompany(
    projectId,
    dto,
    user,
  );
}

@Permissions('PROJECT_VIEW')
@UseGuards(JwtAuthGuard, PermissionsGuard)
@Get(':projectId/companies')
getCompanies(
  @Param('projectId') projectId: string,

  @CurrentUser() user: any,
) {
  return this.projectsService.getCompanies(
    projectId,
    user,
  );
}

// No @Permissions here: the responder belongs to the invited org and
// may not yet hold project-scoped permissions; the service enforces
// that only the invited organization can respond.
@Patch(':projectId/companies/:companyLinkId/respond')
respondToCompanyInvite(
  @Param('projectId') projectId: string,

  @Param('companyLinkId') companyLinkId: string,

  @Body() dto: RespondProjectCompanyDto,

  @CurrentUser() user: any,
) {
  return this.projectsService.respondToCompanyInvite(
    projectId,
    companyLinkId,
    dto.accept,
    user,
  );
}

@Permissions('PROJECT_EDIT')
@UseGuards(JwtAuthGuard, PermissionsGuard)
@Delete(':projectId/companies/:companyLinkId')
removeCompanyLink(
  @Param('projectId') projectId: string,

  @Param('companyLinkId') companyLinkId: string,

  @CurrentUser() user: any,
) {
  return this.projectsService.removeCompanyLink(
    projectId,
    companyLinkId,
    user,
  );
}

// ==========================================
// Project-level role assignment (Two-Level RBAC)
// ==========================================

@Permissions('PROJECT_EDIT')
@UseGuards(JwtAuthGuard, PermissionsGuard)
@Post(':projectId/user-roles')
assignUserRole(
  @Param('projectId') projectId: string,

  @Body() dto: AssignProjectRoleDto,

  @CurrentUser() user: any,
) {
  return this.projectsService.assignUserRole(
    projectId,
    dto,
    user,
  );
}

@Permissions('PROJECT_VIEW')
@UseGuards(JwtAuthGuard, PermissionsGuard)
@Get(':projectId/user-roles')
getUserRoles(
  @Param('projectId') projectId: string,

  @CurrentUser() user: any,
) {
  return this.projectsService.getUserRoles(
    projectId,
    user,
  );
}
}