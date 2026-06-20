import { DashboardService } from './dashboard.service';
export declare class DashboardController {
    private readonly dashboardService;
    constructor(dashboardService: DashboardService);
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
    getMe(req: any): any;
}
