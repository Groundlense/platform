import { Injectable } from '@nestjs/common';

import { DatabaseService } from '../database/database.service';

import { ActivityLogsService } from '../activity-logs/activity-logs.service';

import { CreateProjectDto } from './dto/create-project.dto';

@Injectable()
export class ProjectsService {
  constructor(
    private readonly db: DatabaseService,
    private readonly activityLogsService: ActivityLogsService,
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

  async findAll() {
    return this.db.project.findMany({
      include: {
        epcOrganization: true,
        geotechOrganization: true,
      },
    });
  }

  async addMember(
    projectId: string,
    userId: string,
  ) {
    return this.db.projectMember.create({
      data: {
        projectId,
        userId,
      },
    });
  }

  async getMembers(
    projectId: string,
  ) {
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
}