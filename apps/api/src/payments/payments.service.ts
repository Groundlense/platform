import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import * as crypto from 'crypto';
import { DatabaseService } from '../database/database.service';
import { ProjectAccessService } from '../common/access/project-access.service';
import { CreatePaymentDto } from './dto/create-payment.dto';
import { CreateOrderDto } from './dto/create-order.dto';
import { VerifyPaymentDto } from './dto/verify-payment.dto';

/** Standard rate per boring (INR). Server-authoritative — the client never
 *  sends an amount; it is always derived from the boring count here. */
const PRICE_PER_BORING_INR = 15000;

/** Volume packs, applied automatically by boring count. Ordered by threshold
 *  ascending; the highest qualifying tier wins. MUST stay in sync with
 *  apps/web/src/lib/utils.ts (BORING_PACKS), which only renders the price —
 *  this table is what actually gets charged. */
const BORING_PACKS_INR: { minBorings: number; pricePerBoring: number }[] = [
  { minBorings: 20, pricePerBoring: 13500 }, // Starter Pack — 10% off
  { minBorings: 50, pricePerBoring: 12000 }, // Growth Pack — 20% off
  { minBorings: 100, pricePerBoring: 9000 }, // Mega Pack — 40% off
];

function pricePerBoringInr(count: number): number {
  let price = PRICE_PER_BORING_INR;
  for (const pack of BORING_PACKS_INR) {
    if (count >= pack.minBorings) price = pack.pricePerBoring;
  }
  return price;
}

@Injectable()
export class PaymentsService {
  constructor(
    private readonly db: DatabaseService,
    private readonly access: ProjectAccessService,
  ) {}

  /**
   * Creates a real Razorpay order plus a PENDING Payment row, and returns
   * everything the web checkout needs to open the Razorpay modal.
   */
  async createOrder(user: any, dto: CreateOrderDto) {
    await this.access.assertProjectAccess(user, dto.projectId);

    const keyId = process.env.RAZORPAY_KEY_ID;
    const keySecret = process.env.RAZORPAY_KEY_SECRET;
    if (!keyId || !keySecret) {
      throw new BadRequestException(
        'Payments are not configured (RAZORPAY_KEY_ID / RAZORPAY_KEY_SECRET missing)',
      );
    }

    const amountInr =
      dto.boringsPurchased * pricePerBoringInr(dto.boringsPurchased);

    // Razorpay Orders API — amount is in paise. Receipt max length is 40.
    const res = await fetch('https://api.razorpay.com/v1/orders', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization:
          'Basic ' + Buffer.from(`${keyId}:${keySecret}`).toString('base64'),
      },
      body: JSON.stringify({
        amount: amountInr * 100,
        currency: 'INR',
        receipt: `gl_${dto.projectId.slice(0, 30)}`,
        notes: {
          projectId: dto.projectId,
          boringsPurchased: String(dto.boringsPurchased),
        },
      }),
    });

    if (!res.ok) {
      const body = await res.json().catch(() => null);
      throw new BadRequestException(
        body?.error?.description || `Razorpay order creation failed (${res.status})`,
      );
    }

    const order = (await res.json()) as { id: string; amount: number; currency: string };

    const payment = await this.db.payment.create({
      data: {
        projectId: dto.projectId,
        companyId: user.organizationId,
        initiatedByUserId: user.id,
        planType: 'PER_BORING',
        boringsPurchased: dto.boringsPurchased,
        amountPaid: amountInr,
        razorpayOrderId: order.id,
        status: 'PENDING',
      },
    });

    await this.db.project.update({
      where: { id: dto.projectId },
      data: { totalBoringsPlanned: dto.boringsPurchased },
    }).catch(() => {});

    return {
      paymentId: payment.id,
      orderId: order.id,
      amount: order.amount, // paise
      currency: order.currency,
      keyId,
    };
  }

  async create(user: any, dto: CreatePaymentDto) {
    await this.access.assertProjectAccess(user, dto.projectId);

    const payment = await this.db.payment.create({
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

    await this.db.project.update({
      where: { id: dto.projectId },
      data: { totalBoringsPlanned: dto.boringsPurchased },
    }).catch(() => {});

    return payment;
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
