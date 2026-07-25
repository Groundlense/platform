import { DatabaseService } from '../database/database.service';
import { ProjectAccessService } from '../common/access/project-access.service';
import { ActivityLogsService } from '../activity-logs/activity-logs.service';
import { IntegrityService } from '../common/integrity/integrity.service';
import { CreateReviewDto } from './dto/create-review.dto';
import { BulkReviewDto } from './dto/bulk-review.dto';
import { CreateThreadDto } from './dto/create-thread.dto';
import { CreateMessageDto } from './dto/create-message.dto';
export declare class ReviewsService {
    private readonly db;
    private readonly access;
    private readonly activityLogs;
    private readonly integrity;
    constructor(db: DatabaseService, access: ProjectAccessService, activityLogs: ActivityLogsService, integrity: IntegrityService);
    private intervalTag;
    private parseFieldValue;
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
    createBulkBoreholeReview(user: any, boreholeId: string, dto: BulkReviewDto): Promise<{
        count: number;
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
            attachments: import("@prisma/client/runtime/library").JsonValue | null;
            id: string;
            createdAt: Date;
            message: string;
            senderId: string;
            threadId: string;
        })[];
    } & {
        priority: string;
        id: string;
        status: string;
        createdAt: Date;
        updatedAt: Date;
        boreholeId: string;
        threadType: string;
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
            attachments: import("@prisma/client/runtime/library").JsonValue | null;
            id: string;
            createdAt: Date;
            message: string;
            senderId: string;
            threadId: string;
        })[];
    } & {
        priority: string;
        id: string;
        status: string;
        createdAt: Date;
        updatedAt: Date;
        boreholeId: string;
        threadType: string;
        raisedByUserId: string;
        assignedToUserId: string;
    })[]>;
    findThreadsAssignedToMe(user: any): Promise<({
        borehole: {
            name: string | null;
            id: string;
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
            attachments: import("@prisma/client/runtime/library").JsonValue | null;
            id: string;
            createdAt: Date;
            message: string;
            senderId: string;
            threadId: string;
        })[];
    } & {
        priority: string;
        id: string;
        status: string;
        createdAt: Date;
        updatedAt: Date;
        boreholeId: string;
        threadType: string;
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
        attachments: import("@prisma/client/runtime/library").JsonValue | null;
        id: string;
        createdAt: Date;
        message: string;
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
        priority: string;
        id: string;
        status: string;
        createdAt: Date;
        updatedAt: Date;
        boreholeId: string;
        threadType: string;
        raisedByUserId: string;
        assignedToUserId: string;
    }>;
}
