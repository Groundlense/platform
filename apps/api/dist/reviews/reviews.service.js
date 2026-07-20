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
Object.defineProperty(exports, "__esModule", { value: true });
exports.ReviewsService = void 0;
const common_1 = require("@nestjs/common");
const client_1 = require("@prisma/client");
const database_service_1 = require("../database/database.service");
const project_access_service_1 = require("../common/access/project-access.service");
const activity_logs_service_1 = require("../activity-logs/activity-logs.service");
const integrity_service_1 = require("../common/integrity/integrity.service");
const create_review_dto_1 = require("./dto/create-review.dto");
const INT_INTERVAL_FIELDS = new Set([
    'blow1',
    'blow2',
    'blow3',
    'nValue',
    'nCorrected',
]);
const DIFF_MARKER = '##DIFF##';
const USER_SUMMARY_SELECT = {
    id: true,
    firstName: true,
    lastName: true,
};
let ReviewsService = class ReviewsService {
    db;
    access;
    activityLogs;
    integrity;
    constructor(db, access, activityLogs, integrity) {
        this.db = db;
        this.access = access;
        this.activityLogs = activityLogs;
        this.integrity = integrity;
    }
    intervalTag(intervalId) {
        return `[interval:${intervalId}]`;
    }
    parseFieldValue(field, raw) {
        if (field === 'soilDescription') {
            const trimmed = raw.trim();
            if (!trimmed) {
                throw new common_1.BadRequestException('fieldValueNew cannot be empty');
            }
            return trimmed;
        }
        const n = Number(raw);
        if (!Number.isFinite(n)) {
            throw new common_1.BadRequestException(`fieldValueNew must be a valid number for field "${field}"`);
        }
        if (INT_INTERVAL_FIELDS.has(field) && !Number.isInteger(n)) {
            throw new common_1.BadRequestException(`fieldValueNew must be a whole number for field "${field}"`);
        }
        return n;
    }
    hasReviewPermission(user) {
        return (this.access.isSuperAdmin(user) ||
            (user?.permissions?.includes('REVIEW_CREATE') ?? false));
    }
    async createIntervalReview(user, intervalId, dto) {
        const interval = await this.access.assertIntervalAccess(user, intervalId);
        const isFieldEdit = dto.action === create_review_dto_1.ReviewAction.MODIFY_N ||
            dto.action === create_review_dto_1.ReviewAction.MODIFY_FIELD;
        const field = dto.action === create_review_dto_1.ReviewAction.MODIFY_N
            ? 'nValue'
            : dto.action === create_review_dto_1.ReviewAction.MODIFY_FIELD
                ? (dto.fieldName ?? null)
                : null;
        let newFieldValue = null;
        if (isFieldEdit) {
            if (!field || !create_review_dto_1.EDITABLE_INTERVAL_FIELDS.includes(field)) {
                throw new common_1.BadRequestException(`fieldName must be one of: ${create_review_dto_1.EDITABLE_INTERVAL_FIELDS.join(', ')}`);
            }
            if (!dto.isCodeReason?.trim()) {
                throw new common_1.BadRequestException(`isCodeReason (IS-code justification) is required when action is ${dto.action}`);
            }
            if (dto.action === create_review_dto_1.ReviewAction.MODIFY_N) {
                if (dto.nValueNew === undefined || dto.nValueNew === null) {
                    throw new common_1.BadRequestException('nValueNew is required when action is MODIFY_N');
                }
                newFieldValue = dto.nValueNew;
            }
            else {
                if (dto.fieldValueNew === undefined || dto.fieldValueNew === null) {
                    throw new common_1.BadRequestException('fieldValueNew is required when action is MODIFY_FIELD');
                }
                newFieldValue = this.parseFieldValue(field, dto.fieldValueNew);
            }
        }
        const statusByAction = {
            [create_review_dto_1.ReviewAction.APPROVE]: client_1.ReviewStatus.APPROVED,
            [create_review_dto_1.ReviewAction.REJECT]: client_1.ReviewStatus.REJECTED,
            [create_review_dto_1.ReviewAction.MODIFY_N]: client_1.ReviewStatus.RESOLVED,
            [create_review_dto_1.ReviewAction.MODIFY_FIELD]: client_1.ReviewStatus.RESOLVED,
        };
        const commentParts = [this.intervalTag(intervalId)];
        let oldValue = null;
        let newValue = null;
        let newRemarks = null;
        if (isFieldEdit && field) {
            const rawOld = interval[field];
            const oldFieldValue = rawOld == null
                ? null
                : typeof rawOld === 'object' && typeof rawOld.toNumber === 'function'
                    ? rawOld.toNumber()
                    : rawOld;
            const modificationNote = `${field} modified ${oldFieldValue ?? 'null'}→${newFieldValue} per ${dto.isCodeReason}`;
            commentParts.push(modificationNote);
            const diffLine = `${DIFF_MARKER}${JSON.stringify({
                field,
                old: oldFieldValue,
                new: newFieldValue,
                clause: dto.isCodeReason,
                comment: dto.comments ?? null,
                byUserId: user.id,
                at: new Date().toISOString(),
            })}`;
            oldValue = { [field]: oldFieldValue, remarks: interval.remarks };
            newRemarks = interval.remarks
                ? `${interval.remarks}\n${diffLine}`
                : diffLine;
            newValue = { [field]: newFieldValue, remarks: newRemarks };
        }
        else {
            oldValue = { reviewStatus: null };
            newValue = { reviewStatus: statusByAction[dto.action] };
        }
        if (dto.comments) {
            commentParts.push(dto.comments);
        }
        const review = await this.db.$transaction(async (tx) => {
            if (isFieldEdit && field) {
                await tx.boreholeInterval.update({
                    where: { id: intervalId },
                    data: {
                        [field]: newFieldValue,
                        remarks: newRemarks,
                    },
                });
            }
            return tx.engineerReview.create({
                data: {
                    boreholeId: interval.boreholeId,
                    reviewedByUserId: user.id,
                    reviewType: 'ENGINEER_REVIEW',
                    status: statusByAction[dto.action],
                    comments: commentParts.join(' '),
                    isCodeReason: isFieldEdit
                        ? dto.isCodeReason
                        : (dto.isCodeReason ?? null),
                },
                include: {
                    reviewedBy: { select: USER_SUMMARY_SELECT },
                },
            });
        });
        if (isFieldEdit) {
            await this.integrity.rehashChain(interval.boreholeId, interval.intervalNo);
        }
        await this.activityLogs.log(user.id, `REVIEW_${dto.action}`, 'BoreholeInterval', intervalId, {
            boreholeId: interval.boreholeId,
            reviewId: review.id,
            action: dto.action,
        }, {
            oldValue,
            newValue,
            actorCompanyId: user.organizationId,
            isCodeReason: dto.isCodeReason,
        });
        return review;
    }
    async createBulkBoreholeReview(user, boreholeId, dto) {
        const borehole = await this.access.assertBoreholeAccess(user, boreholeId);
        const intervals = await this.db.boreholeInterval.findMany({
            where: { boreholeId },
            select: { id: true },
        });
        if (intervals.length === 0) {
            return { count: 0 };
        }
        const status = dto.action === 'APPROVE' ? client_1.ReviewStatus.APPROVED : client_1.ReviewStatus.REJECTED;
        const noteText = dto.comments?.trim() ||
            (dto.action === 'APPROVE'
                ? 'Boring approved by engineer review'
                : 'Boring rejected by engineer review');
        await this.db.$transaction(intervals.map((iv) => this.db.engineerReview.create({
            data: {
                boreholeId,
                reviewedByUserId: user.id,
                reviewType: 'ENGINEER_REVIEW',
                status,
                comments: `${this.intervalTag(iv.id)} ${noteText}`,
            },
        })));
        await this.activityLogs.log(user.id, `REVIEW_BULK_${dto.action}`, 'Borehole', boreholeId, { boreholeId: borehole.id, intervalCount: intervals.length }, { newValue: { status }, actorCompanyId: user.organizationId });
        return { count: intervals.length };
    }
    async findReviewsByBorehole(user, boreholeId) {
        await this.access.assertBoreholeAccess(user, boreholeId);
        return this.db.engineerReview.findMany({
            where: { boreholeId },
            include: {
                reviewedBy: { select: USER_SUMMARY_SELECT },
            },
            orderBy: { reviewedAt: 'desc' },
        });
    }
    async findReviewsByInterval(user, intervalId) {
        const interval = await this.access.assertIntervalAccess(user, intervalId);
        return this.db.engineerReview.findMany({
            where: {
                boreholeId: interval.boreholeId,
                comments: { startsWith: this.intervalTag(intervalId) },
            },
            include: {
                reviewedBy: { select: USER_SUMMARY_SELECT },
            },
            orderBy: { reviewedAt: 'desc' },
        });
    }
    async createThread(user, boreholeId, dto) {
        const borehole = await this.access.assertBoreholeAccess(user, boreholeId);
        if (dto.intervalId) {
            const interval = await this.access.assertIntervalAccess(user, dto.intervalId);
            if (interval.boreholeId !== boreholeId) {
                throw new common_1.BadRequestException('Interval does not belong to this borehole');
            }
        }
        const assignedToUserId = borehole.assignedWorkerId ?? user.id;
        const thread = await this.db.reviewThread.create({
            data: {
                boreholeId,
                raisedByUserId: user.id,
                assignedToUserId,
                threadType: 'FIELD_QUERY',
                status: 'OPEN',
                priority: 'NORMAL',
                messages: {
                    create: {
                        senderId: user.id,
                        message: dto.message,
                        attachments: dto.intervalId
                            ? { intervalId: dto.intervalId }
                            : undefined,
                    },
                },
            },
            include: {
                raisedBy: { select: USER_SUMMARY_SELECT },
                assignedTo: { select: USER_SUMMARY_SELECT },
                messages: {
                    include: { sender: { select: USER_SUMMARY_SELECT } },
                    orderBy: { createdAt: 'asc' },
                },
            },
        });
        await this.activityLogs.log(user.id, 'REVIEW_THREAD_CREATE', 'ReviewThread', thread.id, {
            boreholeId,
            intervalId: dto.intervalId ?? null,
            assignedToUserId,
        }, {
            newValue: { status: 'OPEN' },
            actorCompanyId: user.organizationId,
        });
        return thread;
    }
    async findThreadsByBorehole(user, boreholeId) {
        await this.access.assertBoreholeAccess(user, boreholeId);
        return this.db.reviewThread.findMany({
            where: { boreholeId },
            include: {
                raisedBy: { select: USER_SUMMARY_SELECT },
                assignedTo: { select: USER_SUMMARY_SELECT },
                messages: {
                    include: { sender: { select: USER_SUMMARY_SELECT } },
                    orderBy: { createdAt: 'asc' },
                },
            },
            orderBy: { updatedAt: 'desc' },
        });
    }
    async findThreadsAssignedToMe(user) {
        return this.db.reviewThread.findMany({
            where: {
                OR: [
                    { assignedToUserId: user.id },
                    { borehole: { assignedWorkerId: user.id } },
                    {
                        borehole: {
                            team: {
                                members: { some: { userId: user.id } },
                            },
                        },
                    },
                ],
            },
            include: {
                borehole: {
                    select: {
                        id: true,
                        boreholeCode: true,
                        name: true,
                        projectId: true,
                    },
                },
                raisedBy: { select: USER_SUMMARY_SELECT },
                messages: {
                    include: { sender: { select: USER_SUMMARY_SELECT } },
                    orderBy: { createdAt: 'asc' },
                },
            },
            orderBy: { updatedAt: 'desc' },
        });
    }
    async addMessage(user, threadId, dto) {
        const thread = await this.db.reviewThread.findUnique({
            where: { id: threadId },
            include: {
                borehole: {
                    select: {
                        id: true,
                        projectId: true,
                        assignedWorkerId: true,
                    },
                },
            },
        });
        if (!thread) {
            throw new common_1.NotFoundException('Thread not found');
        }
        if (thread.status === 'CLOSED') {
            throw new common_1.BadRequestException('Thread is closed; reopen is not supported');
        }
        const isAssignedWorker = thread.assignedToUserId === user.id ||
            thread.borehole.assignedWorkerId === user.id;
        if (this.hasReviewPermission(user)) {
            await this.access.assertBoreholeAccess(user, thread.boreholeId);
        }
        else if (!isAssignedWorker) {
            throw new common_1.ForbiddenException('Only reviewers or the assigned field worker can reply to this thread');
        }
        const message = await this.db.reviewMessage.create({
            data: {
                threadId,
                senderId: user.id,
                message: dto.message,
            },
            include: {
                sender: { select: USER_SUMMARY_SELECT },
            },
        });
        await this.activityLogs.log(user.id, 'REVIEW_THREAD_REPLY', 'ReviewThread', threadId, { messageId: message.id, boreholeId: thread.boreholeId }, {
            newValue: { message: dto.message },
            actorCompanyId: user.organizationId,
        });
        return message;
    }
    async closeThread(user, threadId) {
        const thread = await this.db.reviewThread.findUnique({
            where: { id: threadId },
        });
        if (!thread) {
            throw new common_1.NotFoundException('Thread not found');
        }
        await this.access.assertBoreholeAccess(user, thread.boreholeId);
        if (thread.status === 'CLOSED') {
            throw new common_1.BadRequestException('Thread is already closed');
        }
        const updated = await this.db.reviewThread.update({
            where: { id: threadId },
            data: { status: 'CLOSED' },
            include: {
                raisedBy: { select: USER_SUMMARY_SELECT },
                assignedTo: { select: USER_SUMMARY_SELECT },
            },
        });
        await this.activityLogs.log(user.id, 'REVIEW_THREAD_CLOSE', 'ReviewThread', threadId, { boreholeId: thread.boreholeId }, {
            oldValue: { status: thread.status },
            newValue: { status: 'CLOSED' },
            actorCompanyId: user.organizationId,
        });
        return updated;
    }
};
exports.ReviewsService = ReviewsService;
exports.ReviewsService = ReviewsService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [database_service_1.DatabaseService,
        project_access_service_1.ProjectAccessService,
        activity_logs_service_1.ActivityLogsService,
        integrity_service_1.IntegrityService])
], ReviewsService);
//# sourceMappingURL=reviews.service.js.map