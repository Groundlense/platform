import {
  Body,
  BadRequestException,
  Controller,
  Get,
  Param,
  Post,
  Res,
  UploadedFile,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';

import { FileInterceptor } from '@nestjs/platform-express';

import { diskStorage } from 'multer';

import { extname, join } from 'path';

import { unlink } from 'fs/promises';

import { randomBytes } from 'crypto';

import type { Response } from 'express';

import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

import { CurrentUser } from '../auth/decorators/current-user.decorator';

import { MediaService } from './media.service';

import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';

const ALLOWED_MIME_TYPES = [
  'image/jpeg',
  'image/png',
  'image/webp',
  'application/pdf',
  // Closure/rig-removal verification videos from the mobile app.
  'video/mp4',
  'video/quicktime',
  'video/3gpp',
];

// Multer's fileSize limit is a single number applied while the stream is
// still being written, so it must be the video ceiling; the tighter
// image/PDF ceiling is enforced after the write (see upload()).
const VIDEO_MAX_BYTES = 100 * 1024 * 1024;
const IMAGE_MAX_BYTES = 15 * 1024 * 1024;

@ApiTags('Media')
@ApiBearerAuth()
@Controller()
@UseGuards(JwtAuthGuard)
export class MediaController {
  constructor(private readonly mediaService: MediaService) {}

  @Post('intervals/:intervalId/media')
  @UseInterceptors(
    FileInterceptor('file', {
      storage: diskStorage({
        destination: './uploads',

        // Random suffix prevents collisions on concurrent uploads.
        filename: (req, file, cb) => {
          cb(
            null,
            `${Date.now()}-${randomBytes(6).toString('hex')}${extname(
              file.originalname,
            )}`,
          );
        },
      }),
      limits: {
        fileSize: VIDEO_MAX_BYTES,
      },
      fileFilter: (req, file, cb) => {
        if (!ALLOWED_MIME_TYPES.includes(file.mimetype)) {
          return cb(
            new BadRequestException(`Unsupported file type ${file.mimetype}`),
            false,
          );
        }
        cb(null, true);
      },
    }),
  )
  async upload(
    @Param('intervalId')
    intervalId: string,

    @UploadedFile()
    file: Express.Multer.File,

    @CurrentUser()
    user: any,

    // Multipart text fields: real GPS stamp + capture context from the
    // mobile photo queue (all optional; older clients send only the file).
    @Body()
    body: {
      gpsLat?: string;
      gpsLng?: string;
      accuracyM?: string;
      purpose?: string;
      takenAt?: string;
    },
  ) {
    // Keep the original 15 MB ceiling for images/PDFs; only videos get the
    // 100 MB multer limit. The oversized file is already on disk at this
    // point, so remove it before rejecting.
    if (
      file &&
      !file.mimetype.startsWith('video/') &&
      file.size > IMAGE_MAX_BYTES
    ) {
      await unlink(join(process.cwd(), 'uploads', file.filename)).catch(
        () => undefined,
      );
      throw new BadRequestException(
        'Images and documents must be 15 MB or smaller',
      );
    }

    return this.mediaService.create(intervalId, file, user, body);
  }

  @Get('intervals/:intervalId/media')
  getMedia(
    @Param('intervalId')
    intervalId: string,

    @CurrentUser()
    user: any,
  ) {
    return this.mediaService.getByInterval(intervalId, user);
  }

  // Authenticated replacement for the removed public /uploads static route.
  @Get('media/:id/file')
  async getFile(
    @Param('id')
    mediaId: string,

    @CurrentUser()
    user: any,

    @Res()
    res: Response,
  ) {
    const { media, absolutePath } = await this.mediaService.getFile(
      mediaId,
      user,
    );

    res.setHeader('Content-Type', media.mimeType ?? 'application/octet-stream');

    return res.sendFile(absolutePath);
  }
}
