"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.ReviewsController = void 0;
const common_1 = require("@nestjs/common");
const swagger_1 = require("@nestjs/swagger");
const jwt_auth_guard_1 = require("../auth/guards/jwt-auth.guard");
const permissions_guard_1 = require("../auth/guards/permissions.guard");
const permissions_decorator_1 = require("../auth/decorators/permissions.decorator");
const current_user_decorator_1 = require("../auth/decorators/current-user.decorator");
const reviews_service_1 = require("./reviews.service");
const create_review_dto_1 = require("./dto/create-review.dto");
const bulk_review_dto_1 = require("./dto/bulk-review.dto");
const create_thread_dto_1 = require("./dto/create-thread.dto");
const create_message_dto_1 = require("./dto/create-message.dto");
let ReviewsController = class ReviewsController {
    reviewsService;
    constructor(reviewsService) {
        this.reviewsService = reviewsService;
    }
    createIntervalReview(intervalId, dto, user) {
        return this.reviewsService.createIntervalReview(user, intervalId, dto);
    }
    createBulkBoreholeReview(boreholeId, dto, user) {
        return this.reviewsService.createBulkBoreholeReview(user, boreholeId, dto);
    }
    findReviewsByBorehole(boreholeId, user) {
        return this.reviewsService.findReviewsByBorehole(user, boreholeId);
    }
    findReviewsByInterval(intervalId, user) {
        return this.reviewsService.findReviewsByInterval(user, intervalId);
    }
    findThreadsAssignedToMe(user) {
        return this.reviewsService.findThreadsAssignedToMe(user);
    }
    createThread(boreholeId, dto, user) {
        return this.reviewsService.createThread(user, boreholeId, dto);
    }
    findThreadsByBorehole(boreholeId, user) {
        return this.reviewsService.findThreadsByBorehole(user, boreholeId);
    }
    addMessage(threadId, dto, user) {
        return this.reviewsService.addMessage(user, threadId, dto);
    }
    closeThread(threadId, user) {
        return this.reviewsService.closeThread(user, threadId);
    }
};
exports.ReviewsController = ReviewsController;
__decorate([
    (0, swagger_1.ApiOperation)({
        summary: 'Review an interval: approve / reject boring data, or modify the N-value with IS-code justification',
    }),
    (0, permissions_decorator_1.Permissions)('REVIEW_CREATE'),
    (0, common_1.Post)('intervals/:intervalId/reviews'),
    __param(0, (0, common_1.Param)('intervalId')),
    __param(1, (0, common_1.Body)()),
    __param(2, (0, current_user_decorator_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, create_review_dto_1.CreateReviewDto, Object]),
    __metadata("design:returntype", void 0)
], ReviewsController.prototype, "createIntervalReview", null);
__decorate([
    (0, swagger_1.ApiOperation)({
        summary: 'Bulk-approve or bulk-reject every interval of a borehole in one call',
    }),
    (0, permissions_decorator_1.Permissions)('REVIEW_CREATE'),
    (0, common_1.Post)('boreholes/:boreholeId/reviews/bulk'),
    __param(0, (0, common_1.Param)('boreholeId')),
    __param(1, (0, common_1.Body)()),
    __param(2, (0, current_user_decorator_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, bulk_review_dto_1.BulkReviewDto, Object]),
    __metadata("design:returntype", void 0)
], ReviewsController.prototype, "createBulkBoreholeReview", null);
__decorate([
    (0, swagger_1.ApiOperation)({
        summary: 'List all engineer reviews for a borehole',
    }),
    (0, permissions_decorator_1.Permissions)('REVIEW_VIEW'),
    (0, common_1.Get)('boreholes/:boreholeId/reviews'),
    __param(0, (0, common_1.Param)('boreholeId')),
    __param(1, (0, current_user_decorator_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", void 0)
], ReviewsController.prototype, "findReviewsByBorehole", null);
__decorate([
    (0, swagger_1.ApiOperation)({
        summary: 'List engineer reviews for a single interval',
    }),
    (0, permissions_decorator_1.Permissions)('REVIEW_VIEW'),
    (0, common_1.Get)('intervals/:intervalId/reviews'),
    __param(0, (0, common_1.Param)('intervalId')),
    __param(1, (0, current_user_decorator_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", void 0)
], ReviewsController.prototype, "findReviewsByInterval", null);
__decorate([
    (0, swagger_1.ApiOperation)({
        summary: 'Query inbox for the mobile field worker: threads assigned to me or on my boreholes/teams',
    }),
    (0, common_1.Get)('threads/assigned-to-me'),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", void 0)
], ReviewsController.prototype, "findThreadsAssignedToMe", null);
__decorate([
    (0, swagger_1.ApiOperation)({
        summary: 'Raise a query thread to the field worker on a borehole',
    }),
    (0, permissions_decorator_1.Permissions)('REVIEW_CREATE'),
    (0, common_1.Post)('boreholes/:boreholeId/threads'),
    __param(0, (0, common_1.Param)('boreholeId')),
    __param(1, (0, common_1.Body)()),
    __param(2, (0, current_user_decorator_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, create_thread_dto_1.CreateThreadDto, Object]),
    __metadata("design:returntype", void 0)
], ReviewsController.prototype, "createThread", null);
__decorate([
    (0, swagger_1.ApiOperation)({
        summary: 'List query threads (with messages) for a borehole',
    }),
    (0, permissions_decorator_1.Permissions)('BOREHOLE_VIEW'),
    (0, common_1.Get)('boreholes/:boreholeId/threads'),
    __param(0, (0, common_1.Param)('boreholeId')),
    __param(1, (0, current_user_decorator_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", void 0)
], ReviewsController.prototype, "findThreadsByBorehole", null);
__decorate([
    (0, swagger_1.ApiOperation)({
        summary: 'Reply to a query thread (reviewers with REVIEW_CREATE, or the assigned field worker)',
    }),
    (0, common_1.Post)('threads/:threadId/messages'),
    __param(0, (0, common_1.Param)('threadId')),
    __param(1, (0, common_1.Body)()),
    __param(2, (0, current_user_decorator_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, create_message_dto_1.CreateMessageDto, Object]),
    __metadata("design:returntype", void 0)
], ReviewsController.prototype, "addMessage", null);
__decorate([
    (0, swagger_1.ApiOperation)({ summary: 'Close a resolved query thread' }),
    (0, permissions_decorator_1.Permissions)('REVIEW_CREATE'),
    (0, common_1.Patch)('threads/:threadId/close'),
    __param(0, (0, common_1.Param)('threadId')),
    __param(1, (0, current_user_decorator_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", void 0)
], ReviewsController.prototype, "closeThread", null);
exports.ReviewsController = ReviewsController = __decorate([
    (0, swagger_1.ApiTags)('Reviews'),
    (0, swagger_1.ApiBearerAuth)(),
    (0, common_1.Controller)(),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard, permissions_guard_1.PermissionsGuard),
    __metadata("design:paramtypes", [reviews_service_1.ReviewsService])
], ReviewsController);
//# sourceMappingURL=reviews.controller.js.map