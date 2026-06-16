import type { Response } from 'express';
import { MediaService } from './media.service';
export declare class MediaController {
    private readonly mediaService;
    constructor(mediaService: MediaService);
    upload(intervalId: string, file: Express.Multer.File, user: any): Promise<{
        id: string;
        createdAt: Date;
        gpsLat: import("@prisma/client/runtime/library").Decimal | null;
        gpsLng: import("@prisma/client/runtime/library").Decimal | null;
        sha256Hash: string | null;
        entityType: import("@prisma/client").$Enums.PhotoEntityType | null;
        entityId: string | null;
        intervalId: string | null;
        fileName: string;
        filePath: string;
        mimeType: string;
        mediaType: import("@prisma/client").$Enums.MediaType;
        uploadedByUserId: string;
        photoType: import("@prisma/client").$Enums.PhotoType | null;
        thumbnailUrl: string | null;
        accuracyM: import("@prisma/client/runtime/library").Decimal | null;
    }>;
    getMedia(intervalId: string, user: any): Promise<{
        id: string;
        createdAt: Date;
        gpsLat: import("@prisma/client/runtime/library").Decimal | null;
        gpsLng: import("@prisma/client/runtime/library").Decimal | null;
        sha256Hash: string | null;
        entityType: import("@prisma/client").$Enums.PhotoEntityType | null;
        entityId: string | null;
        intervalId: string | null;
        fileName: string;
        filePath: string;
        mimeType: string;
        mediaType: import("@prisma/client").$Enums.MediaType;
        uploadedByUserId: string;
        photoType: import("@prisma/client").$Enums.PhotoType | null;
        thumbnailUrl: string | null;
        accuracyM: import("@prisma/client/runtime/library").Decimal | null;
    }[]>;
    getFile(mediaId: string, user: any, res: Response): Promise<void>;
}
