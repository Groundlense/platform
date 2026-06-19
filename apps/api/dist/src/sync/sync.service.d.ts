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
    getConflicts(deviceId: string, user: any): Promise<({
        resolvedBy: {
            id: string;
            firstName: string;
            lastName: string | null;
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
    private applyPhotoCreate;
}
