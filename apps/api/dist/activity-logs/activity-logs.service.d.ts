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
    }): Promise<any>;
    findAll(actor: any): Promise<any>;
    findRecent(actor: any): Promise<any>;
    findByUser(userId: string, actor: any): Promise<any>;
}
