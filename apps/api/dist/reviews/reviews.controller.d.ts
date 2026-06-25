import { ReviewsService } from './reviews.service';
import { CreateReviewDto } from './dto/create-review.dto';
import { CreateThreadDto } from './dto/create-thread.dto';
import { CreateMessageDto } from './dto/create-message.dto';
export declare class ReviewsController {
    private readonly reviewsService;
    constructor(reviewsService: ReviewsService);
    createIntervalReview(intervalId: string, dto: CreateReviewDto, user: any): Promise<{
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
    findReviewsByBorehole(boreholeId: string, user: any): Promise<({
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
    findReviewsByInterval(intervalId: string, user: any): Promise<({
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
    createThread(boreholeId: string, dto: CreateThreadDto, user: any): Promise<{
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
    findThreadsByBorehole(boreholeId: string, user: any): Promise<({
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
    addMessage(threadId: string, dto: CreateMessageDto, user: any): Promise<{
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
    closeThread(threadId: string, user: any): Promise<{
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
