import { DatabaseService } from '../database/database.service';
import { ProjectAccessService } from '../common/access/project-access.service';
import { CreateTeamDto } from './dto/create-team.dto';
export declare class TeamsService {
    private readonly db;
    private readonly access;
    constructor(db: DatabaseService, access: ProjectAccessService);
    private assertTeamAccess;
    createTeam(organizationId: string, dto: CreateTeamDto, actor: any): Promise<{
        id: string;
        organizationId: string;
        createdAt: Date;
        updatedAt: Date;
        name: string;
        isActive: boolean;
        code: string;
        description: string | null;
        projectId: string | null;
        teamPrefix: string | null;
        supervisorUserId: string | null;
        notificationSent: boolean;
    }>;
    getTeams(organizationId: string, actor: any): Promise<({
        members: ({
            user: {
                id: string;
                employeeCode: string | null;
                firstName: string;
                lastName: string | null;
                email: string | null;
                mobile: string | null;
                mobileVerified: boolean;
                status: import("@prisma/client").$Enums.UserStatus;
                userType: string | null;
                designation: string | null;
                preferredLanguage: string | null;
            };
        } & {
            id: string;
            createdAt: Date;
            userId: string;
            teamId: string;
        })[];
    } & {
        id: string;
        organizationId: string;
        createdAt: Date;
        updatedAt: Date;
        name: string;
        isActive: boolean;
        code: string;
        description: string | null;
        projectId: string | null;
        teamPrefix: string | null;
        supervisorUserId: string | null;
        notificationSent: boolean;
    })[]>;
    addMember(teamId: string, userId: string, actor: any): Promise<{
        id: string;
        createdAt: Date;
        userId: string;
        teamId: string;
    }>;
    getTeam(teamId: string, actor: any): Promise<({
        members: ({
            user: {
                id: string;
                employeeCode: string | null;
                firstName: string;
                lastName: string | null;
                email: string | null;
                mobile: string | null;
                mobileVerified: boolean;
                status: import("@prisma/client").$Enums.UserStatus;
                userType: string | null;
                designation: string | null;
                preferredLanguage: string | null;
            };
        } & {
            id: string;
            createdAt: Date;
            userId: string;
            teamId: string;
        })[];
    } & {
        id: string;
        organizationId: string;
        createdAt: Date;
        updatedAt: Date;
        name: string;
        isActive: boolean;
        code: string;
        description: string | null;
        projectId: string | null;
        teamPrefix: string | null;
        supervisorUserId: string | null;
        notificationSent: boolean;
    }) | null>;
    getDashboard(teamId: string, actor: any): Promise<{
        teamId: string | undefined;
        teamName: string | undefined;
        members: number;
        boreholes: number;
        planned: number;
        inProgress: number;
        completed: number;
        abandoned: number;
    }>;
    deleteTeam(teamId: string, actor: any): Promise<{
        id: string;
        organizationId: string;
        createdAt: Date;
        updatedAt: Date;
        name: string;
        isActive: boolean;
        code: string;
        description: string | null;
        projectId: string | null;
        teamPrefix: string | null;
        supervisorUserId: string | null;
        notificationSent: boolean;
    }>;
}
