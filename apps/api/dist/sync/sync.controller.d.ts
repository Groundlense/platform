import { SyncService } from './sync.service';
import { CreateSyncOperationsDto } from './dto/create-sync-operations.dto';
export declare class SyncController {
    private readonly syncService;
    constructor(syncService: SyncService);
    syncQueue(dto: CreateSyncOperationsDto, user: any): Promise<{
        success: boolean;
        processedCount: number;
        results: {
            operationId: string;
            status: import("@prisma/client").SyncStatus;
            error?: string;
        }[];
    }>;
    getConflicts(deviceId: string, user: any): Promise<({
        resolvedBy: {
            firstName: string;
            lastName: string | null;
            id: string;
        } | null;
    } & {
        id: string;
        entityType: import("@prisma/client").$Enums.SyncEntityType;
        entityId: string;
        deviceId: string;
        localVersion: number;
        serverVersion: number;
        conflictDetails: import("@prisma/client/runtime/library").JsonValue;
        resolution: string | null;
        resolvedByUserId: string | null;
        resolvedAt: Date | null;
    })[]>;
}
