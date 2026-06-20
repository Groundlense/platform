import { SoilDescriptionsService } from './soil-descriptions.service';
import { CreateSoilDescriptionDto } from './dto/create-soil-description.dto';
export declare class SoilDescriptionsController {
    private readonly soilDescriptionsService;
    constructor(soilDescriptionsService: SoilDescriptionsService);
    upsert(intervalId: string, user: any, dto: CreateSoilDescriptionDto): Promise<any>;
    findByInterval(intervalId: string): Promise<any>;
}
