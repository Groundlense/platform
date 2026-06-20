import { NotificationsService } from './notifications.service';
export declare class NotificationsController {
    private readonly notificationsService;
    constructor(notificationsService: NotificationsService);
    getNotifications(user: any): Promise<{
        type: string;
        title: string;
        organizationId: string | null;
        id: string;
        createdAt: Date;
        userId: string | null;
        message: string;
        read: boolean;
    }[]>;
    markAsRead(id: string, user: any): Promise<{
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
