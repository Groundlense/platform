import { ProjectsService } from './projects.service';
import { CreateProjectDto } from './dto/create-project.dto';
import { AddProjectMemberDto } from './dto/add-project-member.dto';
import { InviteProjectCompanyDto } from './dto/invite-project-company.dto';
import { RespondProjectCompanyDto } from './dto/respond-project-company.dto';
import { AssignProjectRoleDto } from './dto/assign-project-role.dto';
export declare class ProjectsController {
    private readonly projectsService;
    constructor(projectsService: ProjectsService);
    create(dto: CreateProjectDto, user: any): Promise<any>;
    findAll(user: any): Promise<any>;
    search(code: string, user: any): Promise<{
        found: boolean;
        hasAccess?: undefined;
        project?: undefined;
    } | {
        found: boolean;
        hasAccess: boolean;
        project: any;
    }>;
    globalSearch(query: string, user: any): Promise<any[]>;
    getPendingProjectJoinRequests(user: any): Promise<any>;
    approveProjectJoinRequest(requestId: string, user: any): Promise<{
        success: boolean;
        message: string;
    }>;
    rejectProjectJoinRequest(requestId: string, user: any): Promise<{
        success: boolean;
        message: string;
    }>;
    createJoinRequest(projectId: string, user: any): Promise<any>;
    addMember(projectId: string, dto: AddProjectMemberDto, user: any): Promise<any>;
    getMembers(projectId: string, user: any): Promise<any>;
    getMyProjects(user: any): Promise<any>;
    inviteCompany(projectId: string, dto: InviteProjectCompanyDto, user: any): Promise<any>;
    getCompanies(projectId: string, user: any): Promise<any>;
    respondToCompanyInvite(projectId: string, companyLinkId: string, dto: RespondProjectCompanyDto, user: any): Promise<any>;
    removeCompanyLink(projectId: string, companyLinkId: string, user: any): Promise<{
        removed: boolean;
    }>;
    assignUserRole(projectId: string, dto: AssignProjectRoleDto, user: any): Promise<any>;
    getUserRoles(projectId: string, user: any): Promise<any>;
}
