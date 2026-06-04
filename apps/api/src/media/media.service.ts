import { Injectable } from '@nestjs/common';

import { DatabaseService } from '../database/database.service';
import { ActivityLogsService } from '../activity-logs/activity-logs.service';

@Injectable()
export class MediaService {
  constructor(
    private readonly db: DatabaseService,
    private readonly activityLogsService: ActivityLogsService,
  ) {}

  async create(
    intervalId: string,
    file: Express.Multer.File,
    userId: string,
  ) {
    const media = await this.db.media.create({
      data: {
        intervalId,

        fileName:
          file.originalname,

        filePath:
          file.filename,

        mimeType:
          file.mimetype,

        mediaType: 'PHOTO',

        uploadedByUserId:
          userId,
      },
    });
    await this.activityLogsService.log(
  userId,
  'MEDIA_UPLOADED',
  'MEDIA',
  media.id,
);
    return media;
  }

  async getByInterval(
    intervalId: string,
  ) {
    return this.db.media.findMany({
      where: {
        intervalId,
      },
      orderBy: {
        createdAt: 'desc',
      },
    });
  }
}
