import { DatabaseService } from '../database/database.service';
import { CreateSoilDescriptionDto } from './dto/create-soil-description.dto';
export declare class SoilDescriptionsService {
    private readonly db;
    constructor(db: DatabaseService);
    upsert(intervalId: string, userId: string, dto: CreateSoilDescriptionDto): Promise<{
        description: string;
        id: string;
        createdAt: Date;
        remarks: string | null;
        soilType: string;
        uscsCode: string | null;
        color: string | null;
        consistency: string | null;
        sptRecordId: string;
        enteredByUserId: string;
    }>;
    findByInterval(intervalId: string): Promise<{
        enteredBy: {
            firstName: string;
            lastName: string | null;
            id: string;
        };
    } & {
        description: string;
        id: string;
        createdAt: Date;
        remarks: string | null;
        soilType: string;
        uscsCode: string | null;
        color: string | null;
        consistency: string | null;
        sptRecordId: string;
        enteredByUserId: string;
    }>;
}
