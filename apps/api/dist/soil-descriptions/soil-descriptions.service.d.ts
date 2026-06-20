import { DatabaseService } from '../database/database.service';
import { CreateSoilDescriptionDto } from './dto/create-soil-description.dto';
export declare class SoilDescriptionsService {
    private readonly db;
    constructor(db: DatabaseService);
    upsert(intervalId: string, userId: string, dto: CreateSoilDescriptionDto): Promise<any>;
    findByInterval(intervalId: string): Promise<any>;
}
