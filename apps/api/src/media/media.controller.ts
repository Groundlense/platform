import {
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

import { extname } from 'path';

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
];

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
        fileSize: 15 * 1024 * 1024,
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
  upload(
    @Param('intervalId')
    intervalId: string,

    @UploadedFile()
    file: Express.Multer.File,

    @CurrentUser()
    user: any,
  ) {
    return this.mediaService.create(intervalId, file, user);
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
