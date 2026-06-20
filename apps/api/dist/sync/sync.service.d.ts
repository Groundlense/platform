import { DatabaseService } from '../database/database.service';
import { IntegrityService } from '../common/integrity/integrity.service';
import { CreateSyncOperationsDto } from './dto/create-sync-operations.dto';
import { SyncStatus } from '@prisma/client';
export declare class SyncService {
    private readonly db;
    private readonly integrity;
    private readonly logger;
    constructor(db: DatabaseService, integrity: IntegrityService);
    syncQueue(dto: CreateSyncOperationsDto, user: any): Promise<{
        success: boolean;
        processedCount: number;
        results: {
            operationId: string;
            status: SyncStatus;
            error?: string;
        }[];
    }>;
    private resolveDevice;
    private applyOperation;
    private applyBoringUpdate;
    private applyIntervalUpsert;
    private applySampleCreate;
    private resolveInterval;
    private applyWaterLevelCreate;
    getConflicts(deviceId: string, user: any): Promise<any>;
    private applyPhotoCreate;
}
