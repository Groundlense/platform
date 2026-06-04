import { Injectable } from '@nestjs/common';

import { DatabaseService } from '../database/database.service';

import { CreateBoreholeDto } from './dto/create-borehole.dto';
import { UpdateIntervalDto } from './dto/update-interval.dto';
import { CreateSampleDto } from './dto/create-sample.dto';
import { AssignBoreholeDto } from './dto/assign-borehole.dto';
import { CreateWaterTableDto } from './dto/create-water-table.dto';
import { ActivityLogsService } from 'src/activity-logs/activity-logs.service';
import { BadRequestException, } from '@nestjs/common';
import { BoreholeStatus, } from '@prisma/client';
@Injectable()
export class BoreholesService {
  constructor(
    private readonly db: DatabaseService,
    private readonly activityLogsService: ActivityLogsService,
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

  await this.activityLogsService.log(
  userId,
  'BOREHOLE_CREATED',
  'BOREHOLE',
  borehole.id,
);

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
  userId: string,
  dto: UpdateIntervalDto,
) {
  const interval = await this.db.boreholeInterval.update({
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

  await this.activityLogsService.log(
    userId,
    'INTERVAL_UPDATED',
    'INTERVAL',
    interval.id,
  );

  return interval;
}
async createSample(
  intervalId: string,
  userId: string,
  dto: CreateSampleDto,
) {
    const sample = await this.db.sample.create({
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
  await this.activityLogsService.log(
    userId,
    'SAMPLE_CREATED',
    'SAMPLE',
    sample.id,
  );
  return sample;
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

async assign(
  boreholeId: string,
  userId: string,
  dto: AssignBoreholeDto,
) {
  const borehole = await this.db.borehole.update({
    where: {
      id: boreholeId,
    },
    data: {
      siteId: dto.siteId,
      teamId: dto.teamId,
    },
  }
);
await this.activityLogsService.log(
  userId,
  'BOREHOLE_ASSIGNED',
  'BOREHOLE',
  borehole.id,
  {
    teamId: dto.teamId,
    siteId: dto.siteId,
  },
);
return borehole;

}
async updateStatus(
  boreholeId: string,
  status: BoreholeStatus,
  userId: string,
) {
  const borehole =
    await this.db.borehole.findUnique({
      where: {
        id: boreholeId,
      },
    });

  if (!borehole) {
    throw new BadRequestException(
      'Borehole not found',
    );
  }

  const current =
    borehole.status;

  const validTransitions: Record<
    BoreholeStatus,
    BoreholeStatus[]
  > = {
    PLANNED: [
      'IN_PROGRESS',
      'ABANDONED',
    ],

    IN_PROGRESS: [
      'COMPLETED',
      'ABANDONED',
    ],

    COMPLETED: [],

    ABANDONED: [],
  };

  if (
    !validTransitions[
      current
    ].includes(status)
  ) {
    throw new BadRequestException(
      `Cannot change status from ${current} to ${status}`,
    );
  }

  const updated =
    await this.db.borehole.update({
      where: {
        id: boreholeId,
      },
      data: {
        status,
      },
    });

  await this.activityLogsService.log(
    userId,
    'BOREHOLE_STATUS_CHANGED',
    'BOREHOLE',
    boreholeId,
    {
      from: current,
      to: status,
    },
  );

  return updated;
}
async getReportData(
  boreholeId: string,
) {
  return this.db.borehole.findUnique({
    where: {
      id: boreholeId,
    },

    include: {
      site: true,

      team: true,

      intervals: {
        include: {
          samples: true,

          media: true,
        },
      },
      waterTableObservations: true,
    },
  });
}
async createWaterTableObservation(
  boreholeId: string,
  dto: CreateWaterTableDto,
  userId: string,
) {
  const observation =
    await this.db.waterTableObservation.create({
      data: {
        boreholeId,

        depth: dto.depth,

        observedAt:
          new Date(
            dto.observedAt,
          ),

        remarks:
          dto.remarks,

        createdByUserId:
          userId,
      },
    });

  await this.activityLogsService.log(
    userId,
    'WATER_TABLE_OBSERVED',
    'BOREHOLE',
    boreholeId,
    {
      depth: dto.depth,
    },
  );

  return observation;
}
async getWaterTableObservations(
  boreholeId: string,
) {
  return this.db.waterTableObservation.findMany({
    where: {
      boreholeId,
    },

    orderBy: {
      observedAt: 'desc',
    },
  });
}
}
