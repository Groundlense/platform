import { NotificationsService } from './notifications.service';
export declare class NotificationsController {
    private readonly notificationsService;
    constructor(notificationsService: NotificationsService);
    getNotifications(user: any): Promise<{
        id: string;
        organizationId: string | null;
        createdAt: Date;
        type: string;
        userId: string | null;
        title: string;
        message: string;
        read: boolean;
    }[]>;
    markAsRead(id: string, user: any): Promise<{
        id: string;
        organizationId: string | null;
        createdAt: Date;
        type: string;
        userId: string | null;
        title: string;
        message: string;
        read: boolean;
    }>;
}
