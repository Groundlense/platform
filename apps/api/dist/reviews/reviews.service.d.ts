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
    createIntervalReview(user: any, intervalId: string, dto: CreateReviewDto): Promise<{
        reviewedBy: {
            firstName: string;
            lastName: string | null;
            id: string;
        };
    } & {
        id: string;
        status: import("@prisma/client").$Enums.ReviewStatus;
        boreholeId: string;
        isCodeReason: string | null;
        comments: string | null;
        reviewedByUserId: string;
        reviewType: import("@prisma/client").$Enums.ReviewType;
        reviewedAt: Date;
    }>;
    findReviewsByBorehole(user: any, boreholeId: string): Promise<({
        reviewedBy: {
            firstName: string;
            lastName: string | null;
            id: string;
        };
    } & {
        id: string;
        status: import("@prisma/client").$Enums.ReviewStatus;
        boreholeId: string;
        isCodeReason: string | null;
        comments: string | null;
        reviewedByUserId: string;
        reviewType: import("@prisma/client").$Enums.ReviewType;
        reviewedAt: Date;
    })[]>;
    findReviewsByInterval(user: any, intervalId: string): Promise<({
        reviewedBy: {
            firstName: string;
            lastName: string | null;
            id: string;
        };
    } & {
        id: string;
        status: import("@prisma/client").$Enums.ReviewStatus;
        boreholeId: string;
        isCodeReason: string | null;
        comments: string | null;
        reviewedByUserId: string;
        reviewType: import("@prisma/client").$Enums.ReviewType;
        reviewedAt: Date;
    })[]>;
    createThread(user: any, boreholeId: string, dto: CreateThreadDto): Promise<{
        raisedBy: {
            firstName: string;
            lastName: string | null;
            id: string;
        };
        assignedTo: {
            firstName: string;
            lastName: string | null;
            id: string;
        };
        messages: ({
            sender: {
                firstName: string;
                lastName: string | null;
                id: string;
            };
        } & {
            id: string;
            createdAt: Date;
            message: string;
            attachments: import("@prisma/client/runtime/library").JsonValue | null;
            senderId: string;
            threadId: string;
        })[];
    } & {
        id: string;
        status: string;
        createdAt: Date;
        updatedAt: Date;
        boreholeId: string;
        threadType: string;
        priority: string;
        raisedByUserId: string;
        assignedToUserId: string;
    }>;
    findThreadsByBorehole(user: any, boreholeId: string): Promise<({
        raisedBy: {
            firstName: string;
            lastName: string | null;
            id: string;
        };
        assignedTo: {
            firstName: string;
            lastName: string | null;
            id: string;
        };
        messages: ({
            sender: {
                firstName: string;
                lastName: string | null;
                id: string;
            };
        } & {
            id: string;
            createdAt: Date;
            message: string;
            attachments: import("@prisma/client/runtime/library").JsonValue | null;
            senderId: string;
            threadId: string;
        })[];
    } & {
        id: string;
        status: string;
        createdAt: Date;
        updatedAt: Date;
        boreholeId: string;
        threadType: string;
        priority: string;
        raisedByUserId: string;
        assignedToUserId: string;
    })[]>;
    findThreadsAssignedToMe(user: any): Promise<({
        borehole: {
            id: string;
            name: string | null;
            projectId: string;
            boreholeCode: string;
        };
        raisedBy: {
            firstName: string;
            lastName: string | null;
            id: string;
        };
        messages: ({
            sender: {
                firstName: string;
                lastName: string | null;
                id: string;
            };
        } & {
            id: string;
            createdAt: Date;
            message: string;
            attachments: import("@prisma/client/runtime/library").JsonValue | null;
            senderId: string;
            threadId: string;
        })[];
    } & {
        id: string;
        status: string;
        createdAt: Date;
        updatedAt: Date;
        boreholeId: string;
        threadType: string;
        priority: string;
        raisedByUserId: string;
        assignedToUserId: string;
    })[]>;
    addMessage(user: any, threadId: string, dto: CreateMessageDto): Promise<{
        sender: {
            firstName: string;
            lastName: string | null;
            id: string;
        };
    } & {
        id: string;
        createdAt: Date;
        message: string;
        attachments: import("@prisma/client/runtime/library").JsonValue | null;
        senderId: string;
        threadId: string;
    }>;
    closeThread(user: any, threadId: string): Promise<{
        raisedBy: {
            firstName: string;
            lastName: string | null;
            id: string;
        };
        assignedTo: {
            firstName: string;
            lastName: string | null;
            id: string;
        };
    } & {
        id: string;
        status: string;
        createdAt: Date;
        updatedAt: Date;
        boreholeId: string;
        threadType: string;
        priority: string;
        raisedByUserId: string;
        assignedToUserId: string;
    }>;
}
