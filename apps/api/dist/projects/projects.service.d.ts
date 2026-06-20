import { DatabaseService } from '../database/database.service';
import { ActivityLogsService } from '../activity-logs/activity-logs.service';
import { ProjectAccessService } from '../common/access/project-access.service';
import { CreateProjectDto } from './dto/create-project.dto';
import { InviteProjectCompanyDto } from './dto/invite-project-company.dto';
import { AssignProjectRoleDto } from './dto/assign-project-role.dto';
import { NotificationsService } from '../notifications/notifications.service';
export declare class ProjectsService {
    private readonly db;
    private readonly activityLogsService;
    private readonly access;
    private readonly notificationsService;
    constructor(db: DatabaseService, activityLogsService: ActivityLogsService, access: ProjectAccessService, notificationsService: NotificationsService);
    create(dto: CreateProjectDto, userId: string, organizationId: string): Promise<any>;
    findAll(user: any): Promise<any>;
    searchByCode(code: string, user: any): Promise<{
        found: boolean;
        hasAccess?: undefined;
        project?: undefined;
    } | {
        found: boolean;
        hasAccess: boolean;
        project: any;
    }>;
    addMember(projectId: string, userId: string, actor: any): Promise<any>;
    getMembers(projectId: string, actor: any): Promise<any>;
    getMyProjects(userId: string): Promise<any>;
    inviteCompany(projectId: string, dto: InviteProjectCompanyDto, actor: any): Promise<any>;
    getCompanies(projectId: string, actor: any): Promise<any>;
    respondToCompanyInvite(projectId: string, companyLinkId: string, accept: boolean, actor: any): Promise<any>;
    removeCompanyLink(projectId: string, companyLinkId: string, actor: any): Promise<{
        removed: boolean;
    }>;
    assignUserRole(projectId: string, dto: AssignProjectRoleDto, actor: any): Promise<any>;
    getUserRoles(projectId: string, actor: any): Promise<any>;
    globalSearch(query: string, user: any): Promise<any[]>;
    createJoinRequest(projectId: string, user: any): Promise<any>;
    getPendingProjectJoinRequests(user: any): Promise<any>;
    approveProjectJoinRequest(requestId: string, user: any): Promise<{
        success: boolean;
        message: string;
    }>;
    rejectProjectJoinRequest(requestId: string, user: any): Promise<{
        success: boolean;
        message: string;
    }>;
    private getTransporter;
    private sendMail;
}
