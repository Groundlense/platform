import { DashboardService } from './dashboard.service';
export declare class DashboardController {
    private readonly dashboardService;
    constructor(dashboardService: DashboardService);
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
    getMe(req: any): any;
}
