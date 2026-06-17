import { Injectable } from '@nestjs/common';

import { DatabaseService } from '../database/database.service';

import { CreateSiteDto } from './dto/create-site.dto';

@Injectable()
export class SitesService {
  constructor(private readonly db: DatabaseService) {}

  async create(projectId: string, dto: CreateSiteDto) {
    return this.db.projectSite.create({
      data: {
        projectId,

        code: dto.code,
        name: dto.name,

        description: dto.description,

        latitude: dto.latitude,

        longitude: dto.longitude,
      },
    });
  }

  async findByProject(projectId: string) {
    return this.db.projectSite.findMany({
      where: {
        projectId,
      },
      orderBy: {
        code: 'asc',
      },
    });
  }

  async findOne(id: string) {
    return this.db.projectSite.findUnique({
      where: {
        id,
      },
      include: {
        project: true,
        boreholes: true,
      },
    });
  }
  async getDashboard(siteId: string) {
    const site = await this.db.projectSite.findUnique({
      where: {
        id: siteId,
      },

      include: {
        boreholes: true,
      },
    });

    const boreholes = site?.boreholes ?? [];

    return {
      siteId: site?.id,

      siteName: site?.name,

      boreholes: boreholes.length,

      planned: boreholes.filter((b) => b.status === 'PLANNED').length,

      inProgress: boreholes.filter((b) => b.status === 'IN_PROGRESS').length,

      completed: boreholes.filter((b) => b.status === 'COMPLETED').length,

      abandoned: boreholes.filter((b) => b.status === 'ABANDONED').length,
    };
  }
}
