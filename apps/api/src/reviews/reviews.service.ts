import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { ReviewStatus } from '@prisma/client';
import { DatabaseService } from '../database/database.service';
import { ProjectAccessService } from '../common/access/project-access.service';
import { ActivityLogsService } from '../activity-logs/activity-logs.service';
import { CreateReviewDto, ReviewAction } from './dto/create-review.dto';
import { CreateThreadDto } from './dto/create-thread.dto';
import { CreateMessageDto } from './dto/create-message.dto';

const USER_SUMMARY_SELECT = {
  id: true,
  firstName: true,
  lastName: true,
} as const;

/**
 * Engineer review + field query threads per the ERD/RBAC spec:
 * "Review + approve boring data", "Raise query to field worker",
 * N-value modification with mandatory IS-code justification.
 *
 * Data Ownership Rule: the original record is never overwritten silently —
 * every modification writes an audit row with oldValue/newValue and the
 * IS-code justification.
 *
 * Model note: EngineerReview is borehole-scoped (no intervalId column), so
 * interval-level reviews tag the interval in a structured comments prefix
 * `[interval:<id>]`; the authoritative old/new N-values live in activity_logs.
 */
@Injectable()
export class ReviewsService {
  constructor(
    private readonly db: DatabaseService,
    private readonly access: ProjectAccessService,
    private readonly activityLogs: ActivityLogsService,
  ) {}

  private intervalTag(intervalId: string): string {
    return `[interval:${intervalId}]`;
  }

  private hasReviewPermission(user: any): boolean {
    return (
      this.access.isSuperAdmin(user) ||
      (user?.permissions?.includes('REVIEW_CREATE') ?? false)
    );
  }

  // ==========================================
  // ENGINEER REVIEWS
  // ==========================================

  async createIntervalReview(
    user: any,
    intervalId: string,
    dto: CreateReviewDto,
  ) {
    const interval = await this.access.assertIntervalAccess(user, intervalId);

    if (dto.action === ReviewAction.MODIFY_N) {
      // IS-code justification is mandatory for any N-value change.
      if (dto.nValueNew === undefined || dto.nValueNew === null) {
        throw new BadRequestException(
          'nValueNew is required when action is MODIFY_N',
        );
      }
      if (!dto.isCodeReason?.trim()) {
        throw new BadRequestException(
          'isCodeReason (IS-code justification) is required when action is MODIFY_N',
        );
      }
    }

    const statusByAction: Record<ReviewAction, ReviewStatus> = {
      [ReviewAction.APPROVE]: ReviewStatus.APPROVED,
      [ReviewAction.REJECT]: ReviewStatus.REJECTED,
      // ReviewStatus has no MODIFIED value; a corrected N-value closes the
      // finding, so MODIFY_N maps to RESOLVED.
      [ReviewAction.MODIFY_N]: ReviewStatus.RESOLVED,
    };

    const commentParts = [this.intervalTag(intervalId)];
    let oldValue: any = null;
    let newValue: any = null;

    if (dto.action === ReviewAction.MODIFY_N) {
      const modificationNote = `N modified ${interval.nValue ?? 'null'}→${dto.nValueNew} per ${dto.isCodeReason}`;
      commentParts.push(modificationNote);

      oldValue = {
        nValue: interval.nValue,
        remarks: interval.remarks,
      };

      const newRemarks = interval.remarks
        ? `${interval.remarks}\n${modificationNote}`
        : modificationNote;

      newValue = {
        nValue: dto.nValueNew,
        remarks: newRemarks,
      };
    } else {
      oldValue = { reviewStatus: null };
      newValue = { reviewStatus: statusByAction[dto.action] };
    }

    if (dto.comments) {
      commentParts.push(dto.comments);
    }

    const review = await this.db.$transaction(async (tx) => {
      if (dto.action === ReviewAction.MODIFY_N) {
        await tx.boreholeInterval.update({
          where: { id: intervalId },
          data: {
            nValue: dto.nValueNew,
            remarks: newValue.remarks,
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
          isCodeReason:
            dto.action === ReviewAction.MODIFY_N
              ? dto.isCodeReason
              : (dto.isCodeReason ?? null),
        },
        include: {
          reviewedBy: { select: USER_SUMMARY_SELECT },
        },
      });
    });

    await this.activityLogs.log(
      user.id,
      `REVIEW_${dto.action}`,
      'BoreholeInterval',
      intervalId,
      {
        boreholeId: interval.boreholeId,
        reviewId: review.id,
        action: dto.action,
      },
      {
        oldValue,
        newValue,
        actorCompanyId: user.organizationId,
        isCodeReason: dto.isCodeReason,
      },
    );

    return review;
  }

  async findReviewsByBorehole(user: any, boreholeId: string) {
    await this.access.assertBoreholeAccess(user, boreholeId);

    return this.db.engineerReview.findMany({
      where: { boreholeId },
      include: {
        reviewedBy: { select: USER_SUMMARY_SELECT },
      },
      orderBy: { reviewedAt: 'desc' },
    });
  }

  async findReviewsByInterval(user: any, intervalId: string) {
    const interval = await this.access.assertIntervalAccess(user, intervalId);

    // EngineerReview has no intervalId column; interval-scoped reviews are
    // identified by the structured tag this service writes into comments.
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

  // ==========================================
  // FIELD QUERY THREADS
  // ==========================================

  async createThread(user: any, boreholeId: string, dto: CreateThreadDto) {
    const borehole = await this.access.assertBoreholeAccess(user, boreholeId);

    if (dto.intervalId) {
      const interval = await this.access.assertIntervalAccess(
        user,
        dto.intervalId,
      );
      if (interval.boreholeId !== boreholeId) {
        throw new BadRequestException(
          'Interval does not belong to this borehole',
        );
      }
    }

    // ReviewThread.assignedToUserId is required by the schema; queries are
    // raised to the borehole's assigned field worker. When no worker is
    // assigned yet, the thread falls back to the raiser so it stays valid
    // and can be picked up once assignment happens.
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
            // ReviewMessage has no intervalId column; the interval
            // reference is preserved in the attachments JSON.
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

    await this.activityLogs.log(
      user.id,
      'REVIEW_THREAD_CREATE',
      'ReviewThread',
      thread.id,
      {
        boreholeId,
        intervalId: dto.intervalId ?? null,
        assignedToUserId,
      },
      {
        newValue: { status: 'OPEN' },
        actorCompanyId: user.organizationId,
      },
    );

    return thread;
  }

  async findThreadsByBorehole(user: any, boreholeId: string) {
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

  /**
   * Mobile worker query inbox: threads assigned to the user directly, or on
   * boreholes the user works (assigned worker / member of the borehole team).
   */
  async findThreadsAssignedToMe(user: any) {
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

  async addMessage(user: any, threadId: string, dto: CreateMessageDto) {
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
      throw new NotFoundException('Thread not found');
    }

    if (thread.status === 'CLOSED') {
      throw new BadRequestException(
        'Thread is closed; reopen is not supported',
      );
    }

    // Reviewers (REVIEW_CREATE) and the field worker the query is addressed
    // to may reply; workers have no REVIEW_CREATE permission by design.
    const isAssignedWorker =
      thread.assignedToUserId === user.id ||
      thread.borehole.assignedWorkerId === user.id;

    if (this.hasReviewPermission(user)) {
      // Reviewers must still be scoped to the project.
      await this.access.assertBoreholeAccess(user, thread.boreholeId);
    } else if (!isAssignedWorker) {
      throw new ForbiddenException(
        'Only reviewers or the assigned field worker can reply to this thread',
      );
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

    await this.activityLogs.log(
      user.id,
      'REVIEW_THREAD_REPLY',
      'ReviewThread',
      threadId,
      { messageId: message.id, boreholeId: thread.boreholeId },
      {
        newValue: { message: dto.message },
        actorCompanyId: user.organizationId,
      },
    );

    return message;
  }

  async closeThread(user: any, threadId: string) {
    const thread = await this.db.reviewThread.findUnique({
      where: { id: threadId },
    });

    if (!thread) {
      throw new NotFoundException('Thread not found');
    }

    await this.access.assertBoreholeAccess(user, thread.boreholeId);

    if (thread.status === 'CLOSED') {
      throw new BadRequestException('Thread is already closed');
    }

    const updated = await this.db.reviewThread.update({
      where: { id: threadId },
      data: { status: 'CLOSED' },
      include: {
        raisedBy: { select: USER_SUMMARY_SELECT },
        assignedTo: { select: USER_SUMMARY_SELECT },
      },
    });

    await this.activityLogs.log(
      user.id,
      'REVIEW_THREAD_CLOSE',
      'ReviewThread',
      threadId,
      { boreholeId: thread.boreholeId },
      {
        oldValue: { status: thread.status },
        newValue: { status: 'CLOSED' },
        actorCompanyId: user.organizationId,
      },
    );

    return updated;
  }
}
