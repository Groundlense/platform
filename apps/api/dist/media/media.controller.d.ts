import type { Response } from 'express';
import { MediaService } from './media.service';
export declare class MediaController {
    private readonly mediaService;
    constructor(mediaService: MediaService);
    upload(intervalId: string, file: Express.Multer.File, user: any): Promise<any>;
    getMedia(intervalId: string, user: any): Promise<any>;
    getFile(mediaId: string, user: any, res: Response): Promise<any>;
}
