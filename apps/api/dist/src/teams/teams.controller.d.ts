import { TeamsService } from './teams.service';
import { CreateTeamDto } from './dto/create-team.dto';
import { AddTeamMemberDto } from './dto/add-team-member.dto';
export declare class TeamsController {
    private readonly teamsService;
    constructor(teamsService: TeamsService);
    createTeam(organizationId: string, dto: CreateTeamDto, user: any): Promise<{
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
    getTeams(organizationId: string, user: any): Promise<({
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
    addMember(teamId: string, dto: AddTeamMemberDto, user: any): Promise<{
        id: string;
        createdAt: Date;
        userId: string;
        teamId: string;
    }>;
    getTeam(teamId: string, user: any): Promise<({
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
    getDashboard(teamId: string, user: any): Promise<{
        teamId: string | undefined;
        teamName: string | undefined;
        members: number;
        boreholes: number;
        planned: number;
        inProgress: number;
        completed: number;
        abandoned: number;
    }>;
}
