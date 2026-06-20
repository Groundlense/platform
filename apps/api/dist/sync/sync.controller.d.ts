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
            status: SyncStatus;
            error?: string;
        }[];
    }>;
    getConflicts(deviceId: string, user: any): Promise<any>;
}
