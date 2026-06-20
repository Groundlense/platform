import { TeamsService } from './teams.service';
import { CreateTeamDto } from './dto/create-team.dto';
import { AddTeamMemberDto } from './dto/add-team-member.dto';
export declare class TeamsController {
    private readonly teamsService;
    constructor(teamsService: TeamsService);
    createTeam(organizationId: string, dto: CreateTeamDto, user: any): Promise<any>;
    getTeams(organizationId: string, user: any): Promise<any>;
    addMember(teamId: string, dto: AddTeamMemberDto, user: any): Promise<any>;
    getTeam(teamId: string, user: any): Promise<any>;
    getDashboard(teamId: string, user: any): Promise<{
        teamId: any;
        teamName: any;
        members: any;
        boreholes: any;
        planned: any;
        inProgress: any;
        completed: any;
        abandoned: any;
    }>;
    deleteTeam(teamId: string, user: any): Promise<any>;
}
