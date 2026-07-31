import { Injectable, Logger, NotFoundException } from '@nestjs/common';

import { join } from 'path';
import { existsSync } from 'fs';
import { unlink } from 'fs/promises';

import { DatabaseService } from '../database/database.service';
import { ActivityLogsService } from '../activity-logs/activity-logs.service';
import { ProjectAccessService } from '../common/access/project-access.service';
import { isStampable, stampGeoTag } from './photo-stamp';
import {
  isCloudinaryConfigured,
  isRemoteFilePath,
  uploadToCloudinary,
} from './cloudinary';

@Injectable()
export class MediaService {
  private readonly logger = new Logger(MediaService.name);

  constructor(
    private readonly db: DatabaseService,
    private readonly activityLogsService: ActivityLogsService,
    private readonly access: ProjectAccessService,
  ) {}

  async create(
    intervalId: string,
    file: Express.Multer.File,
    user: any,
    meta?: {
      gpsLat?: string;
      gpsLng?: string;
      accuracyM?: string;
      purpose?: string;
      takenAt?: string;
    },
  ) {
    await this.access.assertIntervalAccess(user, intervalId);

    const num = (v?: string) => {
      const n = Number(v);
      return v != null && Number.isFinite(n) ? n : null;
    };

    // Map the mobile capture purpose onto the ERD photo-type enum.
    const PHOTO_TYPE_BY_PURPOSE: Record<string, string> = {
      SPT: 'SOIL_SAMPLE',
      SAMPLE: 'SOIL_SAMPLE',
      CORE_BOX: 'CORE_BOX',
      SITE_SETUP: 'SITE_SETUP',
      CLOSURE: 'SITE_SETUP',
      CLOSURE_VIDEO: 'CLOSURE_VIDEO',
    };
    const photoType = meta?.purpose
      ? (PHOTO_TYPE_BY_PURPOSE[meta.purpose] as any) ?? null
      : null;

    // Burn the geo-tag banner into the photo itself: borehole context from
    // the DB, coordinates + capture time from the device. A stamping failure
    // must never lose the upload — the photo is field evidence either way.
    if (isStampable(file.mimetype)) {
      try {
        const interval = await this.db.boreholeInterval.findUnique({
          where: { id: intervalId },
          select: {
            borehole: {
              select: {
                boreholeCode: true,
                name: true,
                structureType: true,
                chainage: true,
                span: true,
              },
            },
          },
        });
        const bh = interval?.borehole;
        await stampGeoTag(join(process.cwd(), 'uploads', file.filename), {
          boreholeCode: bh?.boreholeCode,
          subStructure: bh?.name,
          structureType: bh?.structureType,
          chainage: bh?.chainage,
          span: bh?.span,
          gpsLat: num(meta?.gpsLat),
          gpsLng: num(meta?.gpsLng),
          accuracyM: num(meta?.accuracyM),
          takenAt: meta?.takenAt,
        });
      } catch (err) {
        this.logger.warn(
          `Geo-tag stamp failed for ${file.filename} — storing unstamped photo`,
          err instanceof Error ? err.message : String(err),
        );
      }
    }

    // Permanent storage: after the geo-tag is burned in, push the file to
    // Cloudinary and store its https URL. Render's ./uploads is wiped on
    // every redeploy, so keeping bytes only on disk loses field evidence.
    // If the upload fails (or Cloudinary isn't configured), the local file
    // is kept — never lose the photo over a storage hiccup.
    let filePath = file.filename;
    if (isCloudinaryConfigured()) {
      try {
        const localPath = join(process.cwd(), 'uploads', file.filename);
        filePath = await uploadToCloudinary(localPath, {
          folder: 'groundlense',
          fileName: file.originalname,
          mimeType: file.mimetype,
        });
        await unlink(localPath).catch(() => undefined);
      } catch (err) {
        this.logger.warn(
          `Cloudinary upload failed for ${file.filename} — keeping local copy`,
          err instanceof Error ? err.message : String(err),
        );
      }
    }

    const media = await this.db.media.create({
      data: {
        intervalId,

        fileName: file.originalname,

        filePath,

        mimeType: file.mimetype,

        mediaType: file.mimetype.startsWith('video/') ? 'VIDEO' : 'PHOTO',

        uploadedByUserId: user.id,

        // Real GPS stamp from the device at capture time (null when the
        // worker's GPS was unavailable — never fabricated).
        gpsLat: num(meta?.gpsLat),
        gpsLng: num(meta?.gpsLng),
        accuracyM: num(meta?.accuracyM),
        takenAt:
          meta?.takenAt && !Number.isNaN(new Date(meta.takenAt).getTime())
            ? new Date(meta.takenAt)
            : null,
        photoType,
      },
    });
    await this.activityLogsService.log(
      user.id,
      'MEDIA_UPLOADED',
      'MEDIA',
      media.id,
    );
    return media;
  }

  /**
   * NABL lab-report PDF for a sample — a DOCUMENT media row tagged
   * entityType SAMPLE. Returns { id, url }: url is the permanent https URL
   * when Cloudinary stored it, else null and the file is served through
   * the authenticated GET /media/:id/file route.
   */
  async createSampleReport(
    sampleId: string,
    file: Express.Multer.File,
    user: any,
  ) {
    const sample = await this.db.sample.findUnique({
      where: { id: sampleId },
      select: { id: true, intervalId: true },
    });
    if (!sample) {
      throw new NotFoundException('Sample not found');
    }
    await this.access.assertIntervalAccess(user, sample.intervalId);

    let filePath = file.filename;
    if (isCloudinaryConfigured()) {
      try {
        const localPath = join(process.cwd(), 'uploads', file.filename);
        filePath = await uploadToCloudinary(localPath, {
          folder: 'groundlense/lab-reports',
          fileName: file.originalname,
          mimeType: file.mimetype,
        });
        await unlink(localPath).catch(() => undefined);
      } catch (err) {
        this.logger.warn(
          `Cloudinary upload failed for ${file.filename} — keeping local copy`,
          err instanceof Error ? err.message : String(err),
        );
      }
    }

    const media = await this.db.media.create({
      data: {
        intervalId: sample.intervalId,
        fileName: file.originalname,
        filePath,
        mimeType: file.mimetype,
        mediaType: 'DOCUMENT',
        entityType: 'SAMPLE',
        entityId: sampleId,
        uploadedByUserId: user.id,
      },
    });
    await this.activityLogsService.log(
      user.id,
      'MEDIA_UPLOADED',
      'MEDIA',
      media.id,
    );
    return {
      id: media.id,
      url: isRemoteFilePath(filePath) ? filePath : null,
      fileName: file.originalname,
    };
  }

  async getByInterval(intervalId: string, user: any) {
    await this.access.assertIntervalAccess(user, intervalId);

    return this.db.media.findMany({
      where: {
        intervalId,
      },
      orderBy: {
        createdAt: 'desc',
      },
    });
  }

  /**
   * Resolves a media row after an access check. Cloudinary-backed rows
   * (filePath is an https URL) come back as a redirect target; legacy rows
   * resolve to an absolute path under ./uploads.
   */
  async getFile(mediaId: string, user: any) {
    const media = await this.db.media.findUnique({
      where: { id: mediaId },
    });

    if (!media || !media.intervalId) {
      throw new NotFoundException('Media not found');
    }

    await this.access.assertIntervalAccess(user, media.intervalId);

    if (isRemoteFilePath(media.filePath)) {
      return { media, absolutePath: null, redirectUrl: media.filePath };
    }

    const absolutePath = join(process.cwd(), 'uploads', media.filePath);

    if (!existsSync(absolutePath)) {
      throw new NotFoundException('Media file missing on disk');
    }

    return { media, absolutePath, redirectUrl: null };
  }
}
