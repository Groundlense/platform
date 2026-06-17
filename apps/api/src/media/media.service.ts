import { Injectable, NotFoundException } from '@nestjs/common';

import { join } from 'path';
import { existsSync } from 'fs';

import { DatabaseService } from '../database/database.service';
import { ActivityLogsService } from '../activity-logs/activity-logs.service';
import { ProjectAccessService } from '../common/access/project-access.service';

@Injectable()
export class MediaService {
  constructor(
    private readonly db: DatabaseService,
    private readonly activityLogsService: ActivityLogsService,
    private readonly access: ProjectAccessService,
  ) {}

  async create(intervalId: string, file: Express.Multer.File, user: any) {
    await this.access.assertIntervalAccess(user, intervalId);

    const media = await this.db.media.create({
      data: {
        intervalId,

        fileName: file.originalname,

        filePath: file.filename,

        mimeType: file.mimetype,

        mediaType: 'PHOTO',

        uploadedByUserId: user.id,
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

  /** Resolves a media row to an absolute file path after an access check. */
  async getFile(mediaId: string, user: any) {
    const media = await this.db.media.findUnique({
      where: { id: mediaId },
    });

    if (!media || !media.intervalId) {
      throw new NotFoundException('Media not found');
    }

    await this.access.assertIntervalAccess(user, media.intervalId);

    const absolutePath = join(process.cwd(), 'uploads', media.filePath);

    if (!existsSync(absolutePath)) {
      throw new NotFoundException('Media file missing on disk');
    }

    return { media, absolutePath };
  }
}
