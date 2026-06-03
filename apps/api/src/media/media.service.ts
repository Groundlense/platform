import { Injectable } from '@nestjs/common';

import { DatabaseService } from '../database/database.service';

@Injectable()
export class MediaService {
  constructor(
    private readonly db: DatabaseService,
  ) {}

  async create(
    intervalId: string,
    file: Express.Multer.File,
    userId: string,
  ) {
    return this.db.media.create({
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