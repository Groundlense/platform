import { Injectable } from '@nestjs/common';

import { DatabaseService } from '../database/database.service';

import { CreateBoreholeDto } from './dto/create-borehole.dto';
import { UpdateIntervalDto } from './dto/update-interval.dto';
import { CreateSampleDto } from './dto/create-sample.dto';
@Injectable()
export class BoreholesService {
  constructor(
    private readonly db: DatabaseService,
  ) {}

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

  async create(
  projectId: string,
  userId: string,
  dto: CreateBoreholeDto,
) {
  const borehole =
    await this.db.borehole.create({
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

  const plannedDepth =
    Number(dto.plannedDepth ?? 0);

  const intervalSize = 1.5;

  const intervalCount =
    Math.ceil(
      plannedDepth / intervalSize,
    );

  const intervals: any[] = [];

  for (
    let i = 0;
    i < intervalCount;
    i++
  ) {
    const fromDepth =
      i * intervalSize;

    const toDepth =
      Math.min(
        (i + 1) * intervalSize,
        plannedDepth,
      );

    intervals.push({
      boreholeId: borehole.id,

      intervalNo: i + 1,

      fromDepth,
      toDepth,
    });
  }

  if (intervals.length) {
    await this.db.boreholeInterval.createMany({
      data: intervals,
    });
  }

  return borehole;
}

async getIntervals(
  boreholeId: string,
) {
  return this.db.boreholeInterval.findMany({
    where: {
      boreholeId,
    },
    orderBy: {
      intervalNo: 'asc',
    },
  });
}

async updateInterval(
  id: string,
  dto: UpdateIntervalDto,
) {
  return this.db.boreholeInterval.update({
    where: {
      id,
    },
    data: {
      soilDescription:
        dto.soilDescription,

      nValue:
        dto.nValue,

      remarks:
        dto.remarks,

      isCompleted: true,
    },
  });
}
async createSample(
  intervalId: string,
  dto: CreateSampleDto,
) {
  return this.db.sample.create({
    data: {
      intervalId,

      sampleNumber:
        dto.sampleNumber,

      sampleType:
        dto.sampleType,

      sampleDepth:
        dto.sampleDepth,

      remarks:
        dto.remarks,
    },
  });
}
async getSamples(
  intervalId: string,
) {
  return this.db.sample.findMany({
    where: {
      intervalId,
    },
    orderBy: {
      createdAt: 'asc',
    },
  });
}
}