import { DatabaseService } from '../database/database.service';
import { ProjectAccessService } from '../common/access/project-access.service';
import { ActivityLogsService } from '../activity-logs/activity-logs.service';
import { CreateReviewDto } from './dto/create-review.dto';
import { CreateThreadDto } from './dto/create-thread.dto';
import { CreateMessageDto } from './dto/create-message.dto';
export declare class ReviewsService {
    private readonly db;
    private readonly access;
    private readonly activityLogs;
    constructor(db: DatabaseService, access: ProjectAccessService, activityLogs: ActivityLogsService);
    private intervalTag;
    private hasReviewPermission;
    createIntervalReview(user: any, intervalId: string, dto: CreateReviewDto): Promise<any>;
    findReviewsByBorehole(user: any, boreholeId: string): Promise<any>;
    findReviewsByInterval(user: any, intervalId: string): Promise<any>;
    createThread(user: any, boreholeId: string, dto: CreateThreadDto): Promise<any>;
    findThreadsByBorehole(user: any, boreholeId: string): Promise<any>;
    findThreadsAssignedToMe(user: any): Promise<any>;
    addMessage(user: any, threadId: string, dto: CreateMessageDto): Promise<any>;
    closeThread(user: any, threadId: string): Promise<any>;
}
