import { DatabaseService } from '../database/database.service';
import { ActivityLogsService } from '../activity-logs/activity-logs.service';
import { ProjectAccessService } from '../common/access/project-access.service';
export declare class MediaService {
    private readonly db;
    private readonly activityLogsService;
    private readonly access;
    constructor(db: DatabaseService, activityLogsService: ActivityLogsService, access: ProjectAccessService);
    create(intervalId: string, file: Express.Multer.File, user: any): Promise<{
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
        photoType: import("@prisma/client").$Enums.PhotoType | null;
        thumbnailUrl: string | null;
        accuracyM: import("@prisma/client/runtime/library").Decimal | null;
        uploadedByUserId: string;
    }>;
    getByInterval(intervalId: string, user: any): Promise<{
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
        photoType: import("@prisma/client").$Enums.PhotoType | null;
        thumbnailUrl: string | null;
        accuracyM: import("@prisma/client/runtime/library").Decimal | null;
        uploadedByUserId: string;
    }[]>;
    getFile(mediaId: string, user: any): Promise<{
        media: {
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
            photoType: import("@prisma/client").$Enums.PhotoType | null;
            thumbnailUrl: string | null;
            accuracyM: import("@prisma/client/runtime/library").Decimal | null;
            uploadedByUserId: string;
        };
        absolutePath: string;
    }>;
}
