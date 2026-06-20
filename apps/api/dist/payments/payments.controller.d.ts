import { PaymentsService } from './payments.service';
import { CreatePaymentDto } from './dto/create-payment.dto';
import { VerifyPaymentDto } from './dto/verify-payment.dto';
export declare class PaymentsController {
    private readonly paymentsService;
    constructor(paymentsService: PaymentsService);
    create(user: any, dto: CreatePaymentDto): Promise<any>;
    verify(paymentId: string, dto: VerifyPaymentDto, user: any): Promise<any>;
    findByProject(projectId: string, user: any): Promise<any>;
}
