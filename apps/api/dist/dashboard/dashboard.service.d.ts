import { DatabaseService } from '../database/database.service';
import { ProjectAccessService } from '../common/access/project-access.service';
export declare class DashboardService {
    private readonly db;
    private readonly access;
    constructor(db: DatabaseService, access: ProjectAccessService);
    getSummary(user: any): Promise<{
        projects: number;
        boreholes: number;
        intervals: number;
        samples: number;
        media: number;
    }>;
    getProjectDashboard(projectId: string, user: any): Promise<{
        projectId: string;
        projectName: string;
        boreholes: number;
        intervals: number;
        completedIntervals: number;
        completionPercentage: number;
        samples: number;
        media: number;
    }>;
}
