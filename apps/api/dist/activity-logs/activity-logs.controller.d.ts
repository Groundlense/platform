import { ActivityLogsService } from './activity-logs.service';
export declare class ActivityLogsController {
    private readonly activityLogsService;
    constructor(activityLogsService: ActivityLogsService);
    findAll(user: any): Promise<any>;
    findRecent(user: any): Promise<any>;
    findByUser(userId: string, user: any): Promise<any>;
}
