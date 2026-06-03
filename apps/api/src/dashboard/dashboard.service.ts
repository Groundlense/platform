import { Injectable } from '@nestjs/common';

import { DatabaseService } from '../database/database.service';

@Injectable()
export class DashboardService {
  constructor(
    private readonly db: DatabaseService,
  ) {}

  async getSummary() {
    const [
      projects,
      boreholes,
      intervals,
      samples,
      media,
    ] = await Promise.all([
      this.db.project.count(),
      this.db.borehole.count(),
      this.db.boreholeInterval.count(),
      this.db.sample.count(),
      this.db.media.count(),
    ]);

    return {
      projects,
      boreholes,
      intervals,
      samples,
      media,
    };
  }

  async getProjectDashboard(
  projectId: string,
) {
  const project =
    await this.db.project.findUnique({
      where: {
        id: projectId,
      },
    });

  if (!project) {
    throw new Error(
      'Project not found',
    );
  }

  const boreholes =
    await this.db.borehole.findMany({
      where: {
        projectId,
      },
      select: {
        id: true,
      },
    });

  const boreholeIds =
    boreholes.map(
      (b) => b.id,
    );

  const intervals =
    await this.db.boreholeInterval.count({
      where: {
        boreholeId: {
          in: boreholeIds,
        },
      },
    });

  const completedIntervals =
    await this.db.boreholeInterval.count({
      where: {
        boreholeId: {
          in: boreholeIds,
        },

        isCompleted: true,
      },
    });

  const samples =
    await this.db.sample.count({
      where: {
        interval: {
          boreholeId: {
            in: boreholeIds,
          },
        },
      },
    });

  const media =
    await this.db.media.count({
      where: {
        interval: {
          boreholeId: {
            in: boreholeIds,
          },
        },
      },
    });

  const completionPercentage =
    intervals === 0
      ? 0
      : Math.round(
          (completedIntervals /
            intervals) *
            100,
        );

  return {
    projectId,

    projectName:
      project.name,

    boreholes:
      boreholeIds.length,

    intervals,

    completedIntervals,

    completionPercentage,

    samples,

    media,
  };
}
}