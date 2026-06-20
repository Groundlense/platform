import { DatabaseService } from '../database/database.service';
import { ActivityLogsService } from '../activity-logs/activity-logs.service';
import { ProjectAccessService } from '../common/access/project-access.service';
export declare class MediaService {
    private readonly db;
    private readonly activityLogsService;
    private readonly access;
    constructor(db: DatabaseService, activityLogsService: ActivityLogsService, access: ProjectAccessService);
    create(intervalId: string, file: Express.Multer.File, user: any): Promise<any>;
    getByInterval(intervalId: string, user: any): Promise<any>;
    getFile(mediaId: string, user: any): Promise<{
        media: any;
        absolutePath: string;
    }>;
}
