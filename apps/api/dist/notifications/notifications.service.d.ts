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
    }): Promise<{
        type: string;
        title: string;
        organizationId: string | null;
        id: string;
        createdAt: Date;
        userId: string | null;
        message: string;
        read: boolean;
    }>;
    findAll(userId: string, organizationId?: string): Promise<{
        type: string;
        title: string;
        organizationId: string | null;
        id: string;
        createdAt: Date;
        userId: string | null;
        message: string;
        read: boolean;
    }[]>;
    markAsRead(id: string, userId: string, organizationId?: string): Promise<{
        type: string;
        title: string;
        organizationId: string | null;
        id: string;
        createdAt: Date;
        userId: string | null;
        message: string;
        read: boolean;
    }>;
}
