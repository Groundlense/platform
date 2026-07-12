import { Injectable } from '@nestjs/common';

import { DatabaseService } from '../database/database.service';

import { CreateBoreholeDto } from './dto/create-borehole.dto';
import { UpdateIntervalDto } from './dto/update-interval.dto';
import { CreateSampleDto } from './dto/create-sample.dto';
import { AssignBoreholeDto } from './dto/assign-borehole.dto';
import { ActivityLogsService } from 'src/activity-logs/activity-logs.service';
import { ProjectAccessService } from 'src/common/access/project-access.service';
import { IntegrityService } from 'src/common/integrity/integrity.service';
import {
  BadRequestException,
  ForbiddenException,
} from '@nestjs/common';
import { BoreholeStatus } from '@prisma/client';
import { CreateWaterTableDto } from './dto/create-water-table.dto';
@Injectable()
export class BoreholesService {
  constructor(
    private readonly db: DatabaseService,
    private readonly activityLogsService: ActivityLogsService,
    private readonly access: ProjectAccessService,
    private readonly integrity: IntegrityService,
  ) {}

  /**
   * Project setup is frozen once fieldwork has started (any borehole beyond
   * PLANNED): no new boreholes, no member changes. SUPER_ADMIN bypasses.
   */
  async assertSetupUnlocked(projectId: string, user: any) {
    if (this.access.isSuperAdmin(user)) return;

    const started = await this.db.borehole.count({
      where: {
        projectId,
        status: { not: 'PLANNED' },
      },
    });

    if (started > 0) {
      throw new ForbiddenException(
        'Project setup is locked — fieldwork has already started',
      );
    }
  }

  /** True lock state for the web Setup tab banner (no admin bypass). */
  async getSetupStatus(projectId: string, user: any) {
    await this.access.assertProjectAccess(user, projectId);

    const started = await this.db.borehole.count({
      where: {
        projectId,
        status: { not: 'PLANNED' },
      },
    });

    return { locked: started > 0 };
  }

  /**
   * Boreholes assigned to the calling worker via their team memberships.
   * Powers the mobile "assigned to you" list and new-assignment notices.
   */
  async findAssignedToUser(user: any, projectId?: string) {
    return this.db.borehole.findMany({
      where: {
        ...(projectId ? { projectId } : {}),
        team: {
          members: {
            some: { userId: user.id },
          },
        },
      },
      include: {
        team: { select: { id: true, code: true, name: true } },
        project: {
          select: { id: true, projectCode: true, name: true },
        },
      },
      orderBy: { boreholeCode: 'asc' },
    });
  }

  async findByProject(projectId: string, user: any) {
    await this.access.assertProjectAccess(user, projectId);

    return this.db.borehole.findMany({
      where: {
        projectId,
      },
      include: {
        team: true,
      },
      orderBy: {
        boreholeCode: 'asc',
      },
    });
  }

  async findOne(id: string, user: any) {
    await this.access.assertBoreholeAccess(user, id);

    return this.db.borehole.findUnique({
      where: {
        id,
      },
      include: {
        project: true,
      },
    });
  }

  async create(projectId: string, user: any, dto: CreateBoreholeDto) {
    await this.access.assertProjectAccess(user, projectId);
    await this.assertSetupUnlocked(projectId, user);

    const borehole = await this.db.borehole.create({
      data: {
        projectId,

        boreholeCode: dto.boreholeCode,
        name: dto.name,

        latitude: dto.latitude,
        longitude: dto.longitude,

        groundLevelRL: dto.groundLevelRL,

        plannedDepth: dto.plannedDepth,

        structureType: dto.structureType,
        chainage: dto.chainage,
        span: dto.span,

        createdByUserId: user.id,
      },
    });

    // Intervals are NOT pre-generated: per the ERD/RBAC spec, SPT records
    // are captured in the field by workers, never fabricated server-side.

    await this.activityLogsService.log(
      user.id,
      'BOREHOLE_CREATED',
      'BOREHOLE',
      borehole.id,
    );

    return borehole;
  }

  async getIntervals(boreholeId: string, user: any) {
    await this.access.assertBoreholeAccess(user, boreholeId);

    return this.db.boreholeInterval.findMany({
      where: {
        boreholeId,
      },
      orderBy: {
        intervalNo: 'asc',
      },
    });
  }

  async updateInterval(id: string, user: any, dto: UpdateIntervalDto) {
    const existing = await this.access.assertIntervalAccess(user, id);

    const interval = await this.db.boreholeInterval.update({
      where: {
        id,
      },
      data: {
        soilDescription: dto.soilDescription,

        nValue: dto.nValue,

        remarks: dto.remarks,

        isCompleted: true,

        // The original field recorder is immutable evidence — only fill
        // it (with the editor) when no recorder was ever captured.
        recordedByUserId: (existing as any).recordedByUserId ?? user.id,
      } as any,
    });

    // An engineer edit changes hashed content: re-hash this interval
    // (its prevHash link is unchanged) and cascade through every
    // subsequent interval so the tamper-evidence chain stays linked.
    await this.integrity.rehashChain(interval.boreholeId, interval.intervalNo);

    await this.activityLogsService.log(
      user.id,
      'INTERVAL_UPDATED',
      'INTERVAL',
      interval.id,
    );

    // Re-read so the response carries the freshly chained hashes.
    return this.db.boreholeInterval.findUnique({
      where: { id },
    });
  }
  async createSample(intervalId: string, user: any, dto: CreateSampleDto) {
    await this.access.assertIntervalAccess(user, intervalId);

    const sample = await this.db.sample.create({
      data: {
        intervalId,

        sampleNumber: dto.sampleNumber,

        sampleType: dto.sampleType,

        sampleDepth: dto.sampleDepth,

        remarks: dto.remarks,

        collectedByUserId: user.id,

        collectedAt: new Date(),
      },
    });
    await this.activityLogsService.log(
      user.id,
      'SAMPLE_CREATED',
      'SAMPLE',
      sample.id,
    );
    return sample;
  }
  async getSamples(intervalId: string, user: any) {
    await this.access.assertIntervalAccess(user, intervalId);

    return this.db.sample.findMany({
      where: {
        intervalId,
      },
      orderBy: {
        createdAt: 'asc',
      },
    });
  }

  async assign(boreholeId: string, user: any, dto: AssignBoreholeDto) {
    const existing = await this.access.assertBoreholeAccess(
      user,
      boreholeId,
    );

    // A borehole's crew/site can only change while it is still PLANNED —
    // once fieldwork starts, its setup is frozen.
    if (
      existing.status !== 'PLANNED' &&
      !this.access.isSuperAdmin(user)
    ) {
      throw new ForbiddenException(
        'Assignment is locked — fieldwork on this borehole has started',
      );
    }

    const borehole = await this.db.borehole.update({
      where: {
        id: boreholeId,
      },
      data: {
        siteId: dto.siteId,
        teamId: dto.teamId,
        // Named worker — engineer query threads are raised to this user.
        assignedWorkerId: dto.assignedWorkerId,
      },
    });
    await this.activityLogsService.log(
      user.id,
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
  async updateStatus(boreholeId: string, status: BoreholeStatus, user: any) {
    const borehole = await this.access.assertBoreholeAccess(user, boreholeId);

    const current = borehole.status;

    const validTransitions: Record<BoreholeStatus, BoreholeStatus[]> = {
      PLANNED: ['IN_PROGRESS', 'ABANDONED'],

      IN_PROGRESS: ['COMPLETED', 'ABANDONED', 'TERMINATED', 'SUSPENDED'],

      TERMINATED: ['IN_PROGRESS', 'COMPLETED', 'ABANDONED'],

      SUSPENDED: ['IN_PROGRESS', 'ABANDONED'],

      COMPLETED: [],

      ABANDONED: [],
    };

    if (!validTransitions[current].includes(status)) {
      throw new BadRequestException(
        `Cannot change status from ${current} to ${status}`,
      );
    }

    const updated = await this.db.borehole.update({
      where: {
        id: boreholeId,
      },
      data: {
        status,
      },
    });

    await this.activityLogsService.log(
      user.id,
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
  async getReportData(boreholeId: string, user: any) {
    await this.access.assertBoreholeAccess(user, boreholeId);

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
    user: any,
  ) {
    await this.access.assertBoreholeAccess(user, boreholeId);

    const created = await this.db.waterTableObservation.create({
      data: {
        boreholeId,

        depth: dto.depth,

        observedAt: new Date(dto.observedAt),

        remarks: dto.remarks,

        createdByUserId: user.id,
      },
    });

    // Standalone tamper hash (no prev chain on water observations),
    // computed from the persisted values so verification reproduces it.
    const observation = await this.db.waterTableObservation.update({
      where: { id: created.id },
      data: {
        sha256Hash: this.integrity.computeRecordHash(
          null,
          this.integrity.hashWaterTablePayload(created as any),
        ),
      },
    });

    await this.activityLogsService.log(
      user.id,
      'WATER_TABLE_OBSERVED',
      'BOREHOLE',
      boreholeId,
      {
        depth: dto.depth,
      },
    );

    return observation;
  }
  async getWaterTableObservations(boreholeId: string, user: any) {
    await this.access.assertBoreholeAccess(user, boreholeId);

    return this.db.waterTableObservation.findMany({
      where: {
        boreholeId,
      },

      orderBy: {
        observedAt: 'desc',
      },
    });
  }

  /**
   * Tamper-evidence verification: recomputes the SPT interval hash chain
   * from stored field values and the standalone water-table hashes, and
   * reports any record whose stored hash no longer matches.
   */
  async getIntegrity(boreholeId: string, user: any) {
    await this.access.assertBoreholeAccess(user, boreholeId);

    return this.computeIntegritySummary(boreholeId);
  }

  async exportBorehole(boreholeId: string, user: any) {
    const borehole = await this.access.assertBoreholeAccess(user, boreholeId);

    const data = await this.db.borehole.findUnique({
      where: { id: boreholeId },
      include: {
        project: {
          select: {
            id: true,
            projectCode: true,
            name: true,
          },
        },
        site: true,
        team: true,
        intervals: {
          orderBy: { intervalNo: 'asc' },
          include: {
            samples: true,
            media: true,
          },
        },
        waterTableObservations: {
          orderBy: { observedAt: 'asc' },
        },
      },
    });

    const integrity = await this.computeIntegritySummary(boreholeId);

    return {
      fileName: `${this.safeFileName(borehole.boreholeCode)}-export.json`,
      payload: {
        exportedAt: new Date().toISOString(),
        borehole: data,
        integrity,
      },
    };
  }

  async exportBoreholeCsv(boreholeId: string, user: any) {
    const borehole = await this.access.assertBoreholeAccess(user, boreholeId);

    const intervals = await this.db.boreholeInterval.findMany({
      where: { boreholeId },
      orderBy: { intervalNo: 'asc' },
    });

    const header = [
      'intervalNo',
      'fromDepth',
      'toDepth',
      'blow1',
      'blow2',
      'blow3',
      'nValue',
      'nCorrected',
      'isRefusal',
      'soilDescription',
      'observedAt',
      'sha256Hash',
    ];

    const rows = intervals.map((interval) =>
      [
        interval.intervalNo,
        interval.fromDepth,
        interval.toDepth,
        interval.blow1,
        interval.blow2,
        interval.blow3,
        interval.nValue,
        interval.nCorrected,
        interval.isRefusal,
        interval.soilDescription,
        interval.observedAt,
        interval.sha256Hash,
      ]
        .map((cell) => this.csvEscape(cell))
        .join(','),
    );

    return {
      fileName: `${this.safeFileName(borehole.boreholeCode)}-intervals.csv`,
      csv: [header.join(','), ...rows].join('\r\n') + '\r\n',
    };
  }

  async exportProject(projectId: string, user: any) {
    await this.access.assertProjectAccess(user, projectId);

    const project = await this.db.project.findUnique({
      where: { id: projectId },
      include: {
        sites: true,
        boreholes: {
          orderBy: { boreholeCode: 'asc' },
          include: {
            intervals: {
              orderBy: { intervalNo: 'asc' },
              include: { samples: true },
            },
            waterTableObservations: {
              orderBy: { observedAt: 'asc' },
            },
          },
        },
      },
    });

    const integrity: Record<string, any> = {};
    for (const bh of project?.boreholes ?? []) {
      integrity[bh.boreholeCode] = await this.computeIntegritySummary(bh.id);
    }

    return {
      exportedAt: new Date().toISOString(),
      project,
      integrity,
    };
  }

  private async computeIntegritySummary(boreholeId: string) {
    const intervals = await this.db.boreholeInterval.findMany({
      where: { boreholeId },
      orderBy: { intervalNo: 'asc' },
    });

    const brokenAt: number[] = [];
    let unhashed = 0;
    // Stored hash of the immediately preceding interval — what the
    // writer chained against (see IntegrityService canonical form).
    let prevStored: string | null = null;

    for (const interval of intervals) {
      if (!interval.sha256Hash) {
        // Legacy rows captured before hashing existed: reported, but
        // they do not fail the chain.
        unhashed += 1;
        prevStored = null;
        continue;
      }

      const expected = this.integrity.computeRecordHash(
        interval.prevHash ?? null,
        this.integrity.hashIntervalPayload(interval),
      );

      const contentOk = expected === interval.sha256Hash;
      const linkOk = (interval.prevHash ?? null) === prevStored;

      if (!contentOk || !linkOk) {
        brokenAt.push(interval.intervalNo);
      }

      prevStored = interval.sha256Hash;
    }

    const last = intervals[intervals.length - 1];

    const observations = await this.db.waterTableObservation.findMany({
      where: { boreholeId },
    });

    let wtInvalid = 0;
    let wtUnhashed = 0;

    for (const obs of observations) {
      if (!obs.sha256Hash) {
        wtUnhashed += 1;
        continue;
      }

      const expected = this.integrity.computeRecordHash(
        null,
        this.integrity.hashWaterTablePayload(obs),
      );

      if (expected !== obs.sha256Hash) {
        wtInvalid += 1;
      }
    }

    return {
      valid: brokenAt.length === 0 && wtInvalid === 0,
      intervalCount: intervals.length,
      brokenAt,
      unhashed,
      chainRoot: last?.sha256Hash ?? null,
      waterTable: {
        total: observations.length,
        invalid: wtInvalid,
        unhashed: wtUnhashed,
      },
    };
  }

  private safeFileName(value: string): string {
    const cleaned = value.replace(/[^A-Za-z0-9._-]+/g, '_');
    return cleaned.length > 0 ? cleaned : 'borehole';
  }

  /** RFC-4180 style: quote when the cell contains a comma, quote or newline. */
  private csvEscape(value: any): string {
    if (value === null || value === undefined) {
      return '';
    }

    const text = value instanceof Date ? value.toISOString() : String(value);

    return /[",\r\n]/.test(text) ? `"${text.replace(/"/g, '""')}"` : text;
  }
}
