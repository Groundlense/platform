import {
  Controller,
  Get,
  Param,
  Post,
  UploadedFile,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';

import { FileInterceptor } from '@nestjs/platform-express';

import { diskStorage } from 'multer';

import { extname } from 'path';

import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

import { CurrentUser } from '../auth/decorators/current-user.decorator';

import { MediaService } from './media.service';

import {
  ApiBearerAuth,
  ApiTags,
} from '@nestjs/swagger';

@ApiTags('Media')
@ApiBearerAuth()
@Controller()
@UseGuards(JwtAuthGuard)
export class MediaController {
  constructor(
    private readonly mediaService: MediaService,
  ) {}

  @Post(
    'intervals/:intervalId/media',
  )
  @UseInterceptors(
    FileInterceptor('file', {
      storage: diskStorage({
        destination:
          './uploads',

        filename:
          (
            req,
            file,
            cb,
          ) => {
            cb(
              null,
              `${Date.now()}${extname(
                file.originalname,
              )}`,
            );
          },
      }),
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
    return this.mediaService.create(
      intervalId,
      file,
      user.id,
    );
  }

  @Get(
    'intervals/:intervalId/media',
  )
  getMedia(
    @Param('intervalId')
    intervalId: string,
  ) {
    return this.mediaService.getByInterval(
      intervalId,
    );
  }
  
}