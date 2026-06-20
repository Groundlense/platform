import { DatabaseService } from '../database/database.service';
import { CreateSoilDescriptionDto } from './dto/create-soil-description.dto';
export declare class SoilDescriptionsService {
    private readonly db;
    constructor(db: DatabaseService);
    upsert(intervalId: string, userId: string, dto: CreateSoilDescriptionDto): Promise<{
        id: string;
        createdAt: Date;
        description: string;
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
            id: string;
            firstName: string;
            lastName: string | null;
        };
    } & {
        id: string;
        createdAt: Date;
        description: string;
        remarks: string | null;
        soilType: string;
        uscsCode: string | null;
        color: string | null;
        consistency: string | null;
        sptRecordId: string;
        enteredByUserId: string;
    }>;
}
