import { SyncEntityType, OperationType } from '@prisma/client';
export declare class SyncOperationItemDto {
    deviceId: string;
    operationId: string;
    entityType: SyncEntityType;
    entityId: string;
    operationType: OperationType;
    payloadJson: any;
    boringSessionId?: string;
}
export declare class CreateSyncOperationsDto {
    operations: SyncOperationItemDto[];
}
