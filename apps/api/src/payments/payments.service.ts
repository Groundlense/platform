import { Injectable, NotFoundException } from '@nestjs/common';
import { DatabaseService } from '../database/database.service';
import { CreatePaymentDto } from './dto/create-payment.dto';
import { VerifyPaymentDto } from './dto/verify-payment.dto';

@Injectable()
export class PaymentsService {
  constructor(private readonly db: DatabaseService) {}

  async create(userId: string, organizationId: string, dto: CreatePaymentDto) {
    const project = await this.db.project.findUnique({
      where: { id: dto.projectId },
    });
    if (!project) {
      throw new NotFoundException('Project not found');
    }

    return this.db.payment.create({
      data: {
        projectId: dto.projectId,
        companyId: organizationId,
        initiatedByUserId: userId,
        planType: dto.planType,
        boringsPurchased: dto.boringsPurchased,
        amountPaid: dto.amountPaid,
        razorpayOrderId: dto.razorpayOrderId,
        status: 'PENDING',
      },
    });
  }

  async verify(paymentId: string, dto: VerifyPaymentDto) {
    const payment = await this.db.payment.findUnique({
      where: { id: paymentId },
    });
    if (!payment) {
      throw new NotFoundException('Payment transaction not found');
    }

    return this.db.payment.update({
      where: { id: paymentId },
      data: {
        razorpayPaymentId: dto.razorpayPaymentId,
        status: dto.status,
        paidAt: dto.status === 'SUCCESS' ? new Date() : null,
      },
    });
  }

  async findByProject(projectId: string) {
    return this.db.payment.findMany({
      where: { projectId },
      include: {
        initiatedBy: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    });
  }
}
