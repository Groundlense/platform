import { Injectable } from '@nestjs/common';

import { DatabaseService } from '../database/database.service';

import { CreateBoreholeDto } from './dto/create-borehole.dto';

@Injectable()
export class BoreholesService {
  constructor(
    private readonly db: DatabaseService,
  ) {}

  async create(
    projectId: string,
    userId: string,
    dto: CreateBoreholeDto,
  ) {
    return this.db.borehole.create({
      data: {
        projectId,

        boreholeCode: dto.boreholeCode,
        name: dto.name,

        latitude: dto.latitude,
        longitude: dto.longitude,

        groundLevelRL:
          dto.groundLevelRL,

        plannedDepth:
          dto.plannedDepth,

        createdByUserId: userId,
      },
    });
  }

  async findByProject(
    projectId: string,
  ) {
    return this.db.borehole.findMany({
      where: {
        projectId,
      },
      orderBy: {
        boreholeCode: 'asc',
      },
    });
  }

  async findOne(
    id: string,
  ) {
    return this.db.borehole.findUnique({
      where: {
        id,
      },
      include: {
        project: true,
      },
    });
  }
}