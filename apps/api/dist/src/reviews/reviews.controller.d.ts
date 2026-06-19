import { ReviewsService } from './reviews.service';
import { CreateReviewDto } from './dto/create-review.dto';
import { CreateThreadDto } from './dto/create-thread.dto';
import { CreateMessageDto } from './dto/create-message.dto';
export declare class ReviewsController {
    private readonly reviewsService;
    constructor(reviewsService: ReviewsService);
    createIntervalReview(intervalId: string, dto: CreateReviewDto, user: any): Promise<{
        reviewedBy: {
            id: string;
            firstName: string;
            lastName: string | null;
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
            id: string;
            firstName: string;
            lastName: string | null;
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
            id: string;
            firstName: string;
            lastName: string | null;
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
            id: string;
            name: string | null;
            projectId: string;
            boreholeCode: string;
        };
        raisedBy: {
            id: string;
            firstName: string;
            lastName: string | null;
        };
        messages: ({
            sender: {
                id: string;
                firstName: string;
                lastName: string | null;
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
        priority: string;
        threadType: string;
        raisedByUserId: string;
        assignedToUserId: string;
    })[]>;
    createThread(boreholeId: string, dto: CreateThreadDto, user: any): Promise<{
        raisedBy: {
            id: string;
            firstName: string;
            lastName: string | null;
        };
        assignedTo: {
            id: string;
            firstName: string;
            lastName: string | null;
        };
        messages: ({
            sender: {
                id: string;
                firstName: string;
                lastName: string | null;
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
        priority: string;
        threadType: string;
        raisedByUserId: string;
        assignedToUserId: string;
    }>;
    findThreadsByBorehole(boreholeId: string, user: any): Promise<({
        raisedBy: {
            id: string;
            firstName: string;
            lastName: string | null;
        };
        assignedTo: {
            id: string;
            firstName: string;
            lastName: string | null;
        };
        messages: ({
            sender: {
                id: string;
                firstName: string;
                lastName: string | null;
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
        priority: string;
        threadType: string;
        raisedByUserId: string;
        assignedToUserId: string;
    })[]>;
    addMessage(threadId: string, dto: CreateMessageDto, user: any): Promise<{
        sender: {
            id: string;
            firstName: string;
            lastName: string | null;
        };
    } & {
        id: string;
        createdAt: Date;
        message: string;
        attachments: import("@prisma/client/runtime/library").JsonValue | null;
        senderId: string;
        threadId: string;
    }>;
    closeThread(threadId: string, user: any): Promise<{
        raisedBy: {
            id: string;
            firstName: string;
            lastName: string | null;
        };
        assignedTo: {
            id: string;
            firstName: string;
            lastName: string | null;
        };
    } & {
        id: string;
        status: string;
        createdAt: Date;
        updatedAt: Date;
        boreholeId: string;
        priority: string;
        threadType: string;
        raisedByUserId: string;
        assignedToUserId: string;
    }>;
}
