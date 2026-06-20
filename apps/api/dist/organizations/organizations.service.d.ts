import { OrganizationType } from '@prisma/client';
import { DatabaseService } from '../database/database.service';
import { ProjectAccessService } from '../common/access/project-access.service';
import { ActivityLogsService } from '../activity-logs/activity-logs.service';
import { CreateOrganizationDto } from './dto/create-organization.dto';
import { UpdateOrganizationDto } from './dto/update-organization.dto';
import { InviteMembersDto } from './dto/invite-members.dto';
interface AuthUser {
    id: string;
    organizationId?: string;
    roles?: any;
}
export declare class OrganizationsService {
    private readonly db;
    private readonly access;
    private readonly activityLogsService;
    constructor(db: DatabaseService, access: ProjectAccessService, activityLogsService: ActivityLogsService);
    findAll(type?: OrganizationType): Promise<any>;
    findOne(organizationId: string, user: AuthUser): Promise<any>;
    create(dto: CreateOrganizationDto, user: AuthUser): Promise<any>;
    update(organizationId: string, dto: UpdateOrganizationDto, user: AuthUser): Promise<any>;
    verifyKyc(organizationId: string, user: AuthUser): Promise<any>;
    inviteMembers(dto: InviteMembersDto, user: {
        id: string;
        organizationId: string;
    }): Promise<Record<string, unknown>[]>;
    private getTransporter;
    private sendInviteEmail;
    private sendAddedToOrgEmail;
    getJoinRequests(user: AuthUser): Promise<any>;
    approveJoinRequest(requestId: string, user: AuthUser): Promise<{
        success: boolean;
        message: string;
    }>;
    rejectJoinRequest(requestId: string, user: AuthUser): Promise<{
        success: boolean;
        message: string;
    }>;
}
export {};
