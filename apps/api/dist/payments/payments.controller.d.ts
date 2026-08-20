import { PaymentsService } from './payments.service';
import { CreatePaymentDto } from './dto/create-payment.dto';
import { CreateOrderDto } from './dto/create-order.dto';
import { VerifyPaymentDto } from './dto/verify-payment.dto';
export declare class PaymentsController {
    private readonly paymentsService;
    constructor(paymentsService: PaymentsService);
    create(user: any, dto: CreatePaymentDto): Promise<{
        id: string;
        status: import("@prisma/client").$Enums.PaymentStatus;
        createdAt: Date;
        initiatedByUserId: string;
        projectId: string;
        companyId: string;
        planType: string;
        boringsPurchased: number;
        amountPaid: import("@prisma/client/runtime/library").Decimal;
        razorpayOrderId: string;
        razorpayPaymentId: string | null;
        invoiceUrl: string | null;
        paidAt: Date | null;
    }>;
    createOrder(user: any, dto: CreateOrderDto): Promise<{
        paymentId: string;
        orderId: string;
        amount: number;
        currency: string;
        keyId: string;
    }>;
    verify(paymentId: string, dto: VerifyPaymentDto, user: any): Promise<{
        id: string;
        status: import("@prisma/client").$Enums.PaymentStatus;
        createdAt: Date;
        initiatedByUserId: string;
        projectId: string;
        companyId: string;
        planType: string;
        boringsPurchased: number;
        amountPaid: import("@prisma/client/runtime/library").Decimal;
        razorpayOrderId: string;
        razorpayPaymentId: string | null;
        invoiceUrl: string | null;
        paidAt: Date | null;
    }>;
    findByProject(projectId: string, user: any): Promise<({
        initiatedBy: {
            firstName: string;
            lastName: string | null;
            id: string;
        };
    } & {
        id: string;
        status: import("@prisma/client").$Enums.PaymentStatus;
        createdAt: Date;
        initiatedByUserId: string;
        projectId: string;
        companyId: string;
        planType: string;
        boringsPurchased: number;
        amountPaid: import("@prisma/client/runtime/library").Decimal;
        razorpayOrderId: string;
        razorpayPaymentId: string | null;
        invoiceUrl: string | null;
        paidAt: Date | null;
    })[]>;
}
