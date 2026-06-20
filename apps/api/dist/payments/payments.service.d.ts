import { DatabaseService } from '../database/database.service';
import { ProjectAccessService } from '../common/access/project-access.service';
import { CreatePaymentDto } from './dto/create-payment.dto';
import { VerifyPaymentDto } from './dto/verify-payment.dto';
export declare class PaymentsService {
    private readonly db;
    private readonly access;
    constructor(db: DatabaseService, access: ProjectAccessService);
    create(user: any, dto: CreatePaymentDto): Promise<any>;
    verify(paymentId: string, dto: VerifyPaymentDto, user: any): Promise<any>;
    findByProject(projectId: string, user: any): Promise<any>;
}
