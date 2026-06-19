import { DatabaseService } from '../database/database.service';
import { ProjectAccessService } from '../common/access/project-access.service';
export declare class ActivityLogsService {
    private readonly db;
    private readonly access;
    constructor(db: DatabaseService, access: ProjectAccessService);
    private orgScopeWhere;
    log(userId: string, action: string, entityType: string, entityId: string, metadata?: any, options?: {
        oldValue?: any;
        newValue?: any;
        actorCompanyId?: string;
        isCodeReason?: string;
    }): Promise<{
        id: string;
        createdAt: Date;
        userId: string;
        action: string;
        entityType: string;
        entityId: string;
        metadata: import("@prisma/client/runtime/library").JsonValue | null;
        ipAddress: string | null;
        userAgent: string | null;
        isCodeReason: string | null;
        oldValue: import("@prisma/client/runtime/library").JsonValue | null;
        newValue: import("@prisma/client/runtime/library").JsonValue | null;
        actorCompanyId: string | null;
    }>;
    findAll(actor: any): Promise<({
        user: {
            id: string;
            employeeCode: string | null;
            firstName: string;
            lastName: string | null;
            email: string | null;
        };
    } & {
        id: string;
        createdAt: Date;
        userId: string;
        action: string;
        entityType: string;
        entityId: string;
        metadata: import("@prisma/client/runtime/library").JsonValue | null;
        ipAddress: string | null;
        userAgent: string | null;
        isCodeReason: string | null;
        oldValue: import("@prisma/client/runtime/library").JsonValue | null;
        newValue: import("@prisma/client/runtime/library").JsonValue | null;
        actorCompanyId: string | null;
    })[]>;
    findRecent(actor: any): Promise<({
        user: {
            firstName: string;
            lastName: string | null;
        };
    } & {
        id: string;
        createdAt: Date;
        userId: string;
        action: string;
        entityType: string;
        entityId: string;
        metadata: import("@prisma/client/runtime/library").JsonValue | null;
        ipAddress: string | null;
        userAgent: string | null;
        isCodeReason: string | null;
        oldValue: import("@prisma/client/runtime/library").JsonValue | null;
        newValue: import("@prisma/client/runtime/library").JsonValue | null;
        actorCompanyId: string | null;
    })[]>;
    findByUser(userId: string, actor: any): Promise<{
        id: string;
        createdAt: Date;
        userId: string;
        action: string;
        entityType: string;
        entityId: string;
        metadata: import("@prisma/client/runtime/library").JsonValue | null;
        ipAddress: string | null;
        userAgent: string | null;
        isCodeReason: string | null;
        oldValue: import("@prisma/client/runtime/library").JsonValue | null;
        newValue: import("@prisma/client/runtime/library").JsonValue | null;
        actorCompanyId: string | null;
    }[]>;
}
