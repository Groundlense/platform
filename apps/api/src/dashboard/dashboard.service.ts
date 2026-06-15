import {
  Injectable,
  NotFoundException,
} from '@nestjs/common';

import { DatabaseService } from '../database/database.service';

import { ProjectAccessService } from '../common/access/project-access.service';

@Injectable()
export class DashboardService {
  constructor(
    private readonly db: DatabaseService,
    private readonly access: ProjectAccessService,
  ) {}

  async getSummary(user: any) {
    // Counts are limited to projects the caller can actually see.
    const scopedProjects =
      await this.db.project.findMany({
        where: this.access.projectScopeWhere(user),
        select: { id: true },
      });

    const projectIds = scopedProjects.map(
      (p) => p.id,
    );

    const boreholeScope = {
      projectId: { in: projectIds },
    };

    const [
      boreholes,
      intervals,
      samples,
      media,
    ] = await Promise.all([
      this.db.borehole.count({
        where: boreholeScope,
      }),
      this.db.boreholeInterval.count({
        where: { borehole: boreholeScope },
      }),
      this.db.sample.count({
        where: {
          interval: { borehole: boreholeScope },
        },
      }),
      this.db.media.count({
        where: {
          interval: { borehole: boreholeScope },
        },
      }),
    ]);

    return {
      projects: projectIds.length,
      boreholes,
      intervals,
      samples,
      media,
    };
  }

  async getProjectDashboard(
  projectId: string,
  user: any,
) {
  await this.access.assertProjectAccess(
    user,
    projectId,
  );

  const project =
    await this.db.project.findUnique({
      where: {
        id: projectId,
      },
    });

  if (!project) {
    throw new NotFoundException(
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