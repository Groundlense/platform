import { TeamsService } from './teams.service';
import { CreateTeamDto } from './dto/create-team.dto';
import { AddTeamMemberDto } from './dto/add-team-member.dto';
export declare class TeamsController {
    private readonly teamsService;
    constructor(teamsService: TeamsService);
    createTeam(organizationId: string, dto: CreateTeamDto, user: any): Promise<{
        description: string | null;
        organizationId: string;
        id: string;
        createdAt: Date;
        updatedAt: Date;
        name: string;
        isActive: boolean;
        code: string;
        projectId: string | null;
        teamPrefix: string | null;
        supervisorUserId: string | null;
        notificationSent: boolean;
    }>;
    getTeams(organizationId: string, user: any): Promise<({
        members: ({
            user: {
                firstName: string;
                lastName: string | null;
                email: string | null;
                employeeCode: string | null;
                designation: string | null;
                userType: string | null;
                preferredLanguage: string | null;
                id: string;
                mobile: string | null;
                status: import("@prisma/client").$Enums.UserStatus;
            };
        } & {
            id: string;
            createdAt: Date;
            userId: string;
            teamId: string;
        })[];
    } & {
        description: string | null;
        organizationId: string;
        id: string;
        createdAt: Date;
        updatedAt: Date;
        name: string;
        isActive: boolean;
        code: string;
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
                firstName: string;
                lastName: string | null;
                email: string | null;
                employeeCode: string | null;
                designation: string | null;
                userType: string | null;
                preferredLanguage: string | null;
                id: string;
                mobile: string | null;
                status: import("@prisma/client").$Enums.UserStatus;
            };
        } & {
            id: string;
            createdAt: Date;
            userId: string;
            teamId: string;
        })[];
    } & {
        description: string | null;
        organizationId: string;
        id: string;
        createdAt: Date;
        updatedAt: Date;
        name: string;
        isActive: boolean;
        code: string;
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
