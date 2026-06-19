import { DatabaseService } from '../database/database.service';
import { ProjectAccessService } from '../common/access/project-access.service';
import { CreatePaymentDto } from './dto/create-payment.dto';
import { VerifyPaymentDto } from './dto/verify-payment.dto';
export declare class PaymentsService {
    private readonly db;
    private readonly access;
    constructor(db: DatabaseService, access: ProjectAccessService);
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
            id: string;
            firstName: string;
            lastName: string | null;
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
