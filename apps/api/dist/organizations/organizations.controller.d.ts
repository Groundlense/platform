import { OrganizationsService } from './organizations.service';
import { CreateOrganizationDto } from './dto/create-organization.dto';
import { UpdateOrganizationDto } from './dto/update-organization.dto';
import { ListOrganizationsQueryDto } from './dto/list-organizations-query.dto';
import { InviteMembersDto } from './dto/invite-members.dto';
export declare class OrganizationsController {
    private readonly organizationsService;
    constructor(organizationsService: OrganizationsService);
    findAll(query: ListOrganizationsQueryDto): Promise<any>;
    create(dto: CreateOrganizationDto, user: {
        id: string;
        organizationId: string;
        roles?: any;
    }): Promise<any>;
    findOne(organizationId: string, user: {
        id: string;
        organizationId: string;
        roles?: any;
    }): Promise<any>;
    update(organizationId: string, dto: UpdateOrganizationDto, user: {
        id: string;
        organizationId: string;
        roles?: any;
    }): Promise<any>;
    verifyKyc(organizationId: string, user: {
        id: string;
        organizationId: string;
        roles?: any;
    }): Promise<any>;
    inviteMembers(dto: InviteMembersDto, user: {
        id: string;
        organizationId: string;
        roles?: any;
    }): Promise<Record<string, unknown>[]>;
    getJoinRequests(user: {
        id: string;
        organizationId: string;
        roles?: any;
    }): Promise<any>;
    approveJoinRequest(requestId: string, user: {
        id: string;
        organizationId: string;
        roles?: any;
    }): Promise<{
        success: boolean;
        message: string;
    }>;
    rejectJoinRequest(requestId: string, user: {
        id: string;
        organizationId: string;
        roles?: any;
    }): Promise<{
        success: boolean;
        message: string;
    }>;
}
