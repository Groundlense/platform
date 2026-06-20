import { DatabaseService } from '../database/database.service';
import { CreateSiteDto } from './dto/create-site.dto';
export declare class SitesService {
    private readonly db;
    constructor(db: DatabaseService);
    create(projectId: string, dto: CreateSiteDto): Promise<any>;
    findByProject(projectId: string): Promise<any>;
    findOne(id: string): Promise<any>;
    getDashboard(siteId: string): Promise<{
        siteId: any;
        siteName: any;
        boreholes: any;
        planned: any;
        inProgress: any;
        completed: any;
        abandoned: any;
    }>;
}
