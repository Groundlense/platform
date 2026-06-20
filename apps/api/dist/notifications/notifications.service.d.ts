import { DatabaseService } from '../database/database.service';
export declare class NotificationsService {
    private readonly db;
    constructor(db: DatabaseService);
    create(data: {
        userId?: string;
        organizationId?: string;
        title: string;
        message: string;
        type: string;
    }): Promise<any>;
    findAll(userId: string, organizationId?: string): Promise<any>;
    markAsRead(id: string, userId: string, organizationId?: string): Promise<any>;
}
