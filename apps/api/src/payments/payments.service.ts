import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import * as crypto from 'crypto';
import { DatabaseService } from '../database/database.service';
import { ProjectAccessService } from '../common/access/project-access.service';
import { CreatePaymentDto } from './dto/create-payment.dto';
import { VerifyPaymentDto } from './dto/verify-payment.dto';

@Injectable()
export class PaymentsService {
  constructor(
    private readonly db: DatabaseService,
    private readonly access: ProjectAccessService,
  ) {}

  async create(user: any, dto: CreatePaymentDto) {
    await this.access.assertProjectAccess(user, dto.projectId);

    return this.db.payment.create({
      data: {
        projectId: dto.projectId,
        companyId: user.organizationId,
        initiatedByUserId: user.id,
        planType: dto.planType,
        boringsPurchased: dto.boringsPurchased,
        amountPaid: dto.amountPaid,
        razorpayOrderId: dto.razorpayOrderId,
        status: 'PENDING',
      },
    });
  }

  async verify(paymentId: string, dto: VerifyPaymentDto, user: any) {
    const payment = await this.db.payment.findUnique({
      where: { id: paymentId },
    });
    if (!payment) {
      throw new NotFoundException('Payment transaction not found');
    }

    await this.access.assertProjectAccess(user, payment.projectId);

    // The client never decides the outcome: success is established only by
    // validating Razorpay's signature with our key secret.
    const keySecret = process.env.RAZORPAY_KEY_SECRET;
    if (!keySecret) {
      throw new BadRequestException(
        'Payment verification is not configured (RAZORPAY_KEY_SECRET missing)',
      );
    }

    const expectedSignature = crypto
      .createHmac('sha256', keySecret)
      .update(`${payment.razorpayOrderId}|${dto.razorpayPaymentId}`)
      .digest('hex');

    const signatureValid =
      expectedSignature.length === dto.razorpaySignature.length &&
      crypto.timingSafeEqual(
        Buffer.from(expectedSignature),
        Buffer.from(dto.razorpaySignature),
      );

    if (!signatureValid) {
      await this.db.payment.update({
        where: { id: paymentId },
        data: {
          razorpayPaymentId: dto.razorpayPaymentId,
          status: 'FAILED',
        },
      });

      throw new BadRequestException('Invalid payment signature');
    }

    return this.db.$transaction(async (tx) => {
      const updated = await tx.payment.update({
        where: { id: paymentId },
        data: {
          razorpayPaymentId: dto.razorpayPaymentId,
          status: 'SUCCESS',
          paidAt: new Date(),
        },
      });

      // Successful payment unlocks the project's boring data (spec:
      // "Unlock paid boring data — AUTO / AFTER PAY").
      await tx.project.update({
        where: { id: payment.projectId },
        data: { lockedAt: null },
      });

      return updated;
    });
  }

  async findByProject(projectId: string, user: any) {
    await this.access.assertProjectAccess(user, projectId);

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
