import { Injectable, NotFoundException } from '@nestjs/common';
import { DatabaseService } from '../database/database.service';

@Injectable()
export class NotificationsService {
  constructor(private readonly db: DatabaseService) {}

  async create(data: {
    userId?: string;
    organizationId?: string;
    title: string;
    message: string;
    type: string;
  }) {
    return this.db.notification.create({
      data: {
        userId: data.userId || null,
        organizationId: data.organizationId || null,
        title: data.title,
        message: data.message,
        type: data.type,
      },
    });
  }

  async findAll(userId: string, organizationId?: string) {
    return this.db.notification.findMany({
      where: {
        OR: [
          { userId },
          ...(organizationId ? [{ organizationId }] : []),
        ],
      },
      orderBy: {
        createdAt: 'desc',
      },
    });
  }

  async markAsRead(id: string, userId: string, organizationId?: string) {
    const notification = await this.db.notification.findUnique({
      where: { id },
    });

    if (!notification) {
      throw new NotFoundException('Notification not found');
    }

    // Ensure user belongs to the notification target
    if (
      notification.userId !== userId &&
      (!organizationId || notification.organizationId !== organizationId)
    ) {
      throw new NotFoundException('Notification not found');
    }

    return this.db.notification.update({
      where: { id },
      data: { read: true },
    });
  }
}
