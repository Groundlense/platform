import { Injectable } from '@nestjs/common';

import { DatabaseService } from '../database/database.service';

import { CreateProjectDto } from './dto/create-project.dto';

@Injectable()
export class ProjectsService {
  constructor(
    private readonly db: DatabaseService,
  ) {}

  async create(
    dto: CreateProjectDto,
    userId: string,
    organizationId: string,
  ) {
    return this.db.project.create({
      data: {
        projectCode: dto.projectCode,
        name: dto.name,
        description: dto.description,

        startDate: dto.startDate
          ? new Date(dto.startDate)
          : null,

        endDate: dto.endDate
          ? new Date(dto.endDate)
          : null,

        createdByUserId: userId,

        epcOrganizationId:
          organizationId,

        geotechOrganizationId:
          dto.geotechOrganizationId,
      },
    });
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