import { DatabaseService } from '../database/database.service';
import { ProjectAccessService } from '../common/access/project-access.service';
export declare class DashboardService {
    private readonly db;
    private readonly access;
    constructor(db: DatabaseService, access: ProjectAccessService);
    getSummary(user: any): Promise<{
        projects: any;
        boreholes: any;
        intervals: any;
        samples: any;
        media: any;
    }>;
    getProjectDashboard(projectId: string, user: any): Promise<{
        projectId: string;
        projectName: any;
        boreholes: any;
        intervals: any;
        completedIntervals: any;
        completionPercentage: number;
        samples: any;
        media: any;
    }>;
}
