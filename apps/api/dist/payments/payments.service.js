"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.PaymentsService = void 0;
const common_1 = require("@nestjs/common");
const crypto = __importStar(require("crypto"));
const database_service_1 = require("../database/database.service");
const project_access_service_1 = require("../common/access/project-access.service");
const PRICE_PER_BORING_INR = 15000;
const BORING_PACKS_INR = [
    { minBorings: 20, pricePerBoring: 13500 },
    { minBorings: 50, pricePerBoring: 12000 },
    { minBorings: 100, pricePerBoring: 9000 },
];
function pricePerBoringInr(count) {
    let price = PRICE_PER_BORING_INR;
    for (const pack of BORING_PACKS_INR) {
        if (count >= pack.minBorings)
            price = pack.pricePerBoring;
    }
    return price;
}
let PaymentsService = class PaymentsService {
    db;
    access;
    constructor(db, access) {
        this.db = db;
        this.access = access;
    }
    async createOrder(user, dto) {
        await this.access.assertProjectAccess(user, dto.projectId);
        const keyId = process.env.RAZORPAY_KEY_ID;
        const keySecret = process.env.RAZORPAY_KEY_SECRET;
        if (!keyId || !keySecret) {
            throw new common_1.BadRequestException('Payments are not configured (RAZORPAY_KEY_ID / RAZORPAY_KEY_SECRET missing)');
        }
        const amountInr = dto.boringsPurchased * pricePerBoringInr(dto.boringsPurchased);
        const res = await fetch('https://api.razorpay.com/v1/orders', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                Authorization: 'Basic ' + Buffer.from(`${keyId}:${keySecret}`).toString('base64'),
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
            throw new common_1.BadRequestException(body?.error?.description || `Razorpay order creation failed (${res.status})`);
        }
        const order = (await res.json());
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
        }).catch(() => { });
        return {
            paymentId: payment.id,
            orderId: order.id,
            amount: order.amount,
            currency: order.currency,
            keyId,
        };
    }
    async create(user, dto) {
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
        }).catch(() => { });
        return payment;
    }
    async verify(paymentId, dto, user) {
        const payment = await this.db.payment.findUnique({
            where: { id: paymentId },
        });
        if (!payment) {
            throw new common_1.NotFoundException('Payment transaction not found');
        }
        await this.access.assertProjectAccess(user, payment.projectId);
        const keySecret = process.env.RAZORPAY_KEY_SECRET;
        if (!keySecret) {
            throw new common_1.BadRequestException('Payment verification is not configured (RAZORPAY_KEY_SECRET missing)');
        }
        const expectedSignature = crypto
            .createHmac('sha256', keySecret)
            .update(`${payment.razorpayOrderId}|${dto.razorpayPaymentId}`)
            .digest('hex');
        const signatureValid = expectedSignature.length === dto.razorpaySignature.length &&
            crypto.timingSafeEqual(Buffer.from(expectedSignature), Buffer.from(dto.razorpaySignature));
        if (!signatureValid) {
            await this.db.payment.update({
                where: { id: paymentId },
                data: {
                    razorpayPaymentId: dto.razorpayPaymentId,
                    status: 'FAILED',
                },
            });
            throw new common_1.BadRequestException('Invalid payment signature');
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
            await tx.project.update({
                where: { id: payment.projectId },
                data: { lockedAt: null },
            });
            return updated;
        });
    }
    async findByProject(projectId, user) {
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
};
exports.PaymentsService = PaymentsService;
exports.PaymentsService = PaymentsService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [database_service_1.DatabaseService,
        project_access_service_1.ProjectAccessService])
], PaymentsService);
//# sourceMappingURL=payments.service.js.map