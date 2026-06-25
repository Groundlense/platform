import { DatabaseService } from '../database/database.service';
import { ProjectAccessService } from '../common/access/project-access.service';
import { CreateTeamDto } from './dto/create-team.dto';
export declare class TeamsService {
    private readonly db;
    private readonly access;
    constructor(db: DatabaseService, access: ProjectAccessService);
    private assertTeamAccess;
    createTeam(organizationId: string, dto: CreateTeamDto, actor: any): Promise<{
        name: string;
        description: string | null;
        organizationId: string;
        id: string;
        createdAt: Date;
        updatedAt: Date;
        isActive: boolean;
        code: string;
        projectId: string | null;
        teamPrefix: string | null;
        supervisorUserId: string | null;
        notificationSent: boolean;
    }>;
    getTeams(organizationId: string, actor: any): Promise<({
        members: ({
            user: {
                firstName: string;
                lastName: string | null;
                email: string | null;
                employeeCode: string | null;
                designation: string | null;
                userType: string | null;
                preferredLanguage: string | null;
                mobile: string | null;
                id: string;
                mobileVerified: boolean;
                status: import("@prisma/client").$Enums.UserStatus;
            };
        } & {
            id: string;
            createdAt: Date;
            userId: string;
            teamId: string;
        })[];
    } & {
        name: string;
        description: string | null;
        organizationId: string;
        id: string;
        createdAt: Date;
        updatedAt: Date;
        isActive: boolean;
        code: string;
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
                firstName: string;
                lastName: string | null;
                email: string | null;
                employeeCode: string | null;
                designation: string | null;
                userType: string | null;
                preferredLanguage: string | null;
                mobile: string | null;
                id: string;
                mobileVerified: boolean;
                status: import("@prisma/client").$Enums.UserStatus;
            };
        } & {
            id: string;
            createdAt: Date;
            userId: string;
            teamId: string;
        })[];
    } & {
        name: string;
        description: string | null;
        organizationId: string;
        id: string;
        createdAt: Date;
        updatedAt: Date;
        isActive: boolean;
        code: string;
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
        name: string;
        description: string | null;
        organizationId: string;
        id: string;
        createdAt: Date;
        updatedAt: Date;
        isActive: boolean;
        code: string;
        projectId: string | null;
        teamPrefix: string | null;
        supervisorUserId: string | null;
        notificationSent: boolean;
    }>;
}
