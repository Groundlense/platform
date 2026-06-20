import { DatabaseService } from '../database/database.service';
import { ProjectAccessService } from '../common/access/project-access.service';
import { CreateTeamDto } from './dto/create-team.dto';
export declare class TeamsService {
    private readonly db;
    private readonly access;
    constructor(db: DatabaseService, access: ProjectAccessService);
    private assertTeamAccess;
    createTeam(organizationId: string, dto: CreateTeamDto, actor: any): Promise<any>;
    getTeams(organizationId: string, actor: any): Promise<any>;
    addMember(teamId: string, userId: string, actor: any): Promise<any>;
    getTeam(teamId: string, actor: any): Promise<any>;
    getDashboard(teamId: string, actor: any): Promise<{
        teamId: any;
        teamName: any;
        members: any;
        boreholes: any;
        planned: any;
        inProgress: any;
        completed: any;
        abandoned: any;
    }>;
    deleteTeam(teamId: string, actor: any): Promise<any>;
}
