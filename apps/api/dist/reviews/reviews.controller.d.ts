import { ReviewsService } from './reviews.service';
import { CreateReviewDto } from './dto/create-review.dto';
import { CreateThreadDto } from './dto/create-thread.dto';
import { CreateMessageDto } from './dto/create-message.dto';
export declare class ReviewsController {
    private readonly reviewsService;
    constructor(reviewsService: ReviewsService);
    createIntervalReview(intervalId: string, dto: CreateReviewDto, user: any): Promise<any>;
    findReviewsByBorehole(boreholeId: string, user: any): Promise<any>;
    findReviewsByInterval(intervalId: string, user: any): Promise<any>;
    findThreadsAssignedToMe(user: any): Promise<any>;
    createThread(boreholeId: string, dto: CreateThreadDto, user: any): Promise<any>;
    findThreadsByBorehole(boreholeId: string, user: any): Promise<any>;
    addMessage(threadId: string, dto: CreateMessageDto, user: any): Promise<any>;
    closeThread(threadId: string, user: any): Promise<any>;
}
