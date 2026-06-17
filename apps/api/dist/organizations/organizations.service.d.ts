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
    findAll(type?: OrganizationType): Promise<{
        type: import("@prisma/client").$Enums.OrganizationType;
        id: string;
        name: string;
        city: string | null;
        state: string | null;
    }[]>;
    findOne(organizationId: string, user: AuthUser): Promise<{
        type: import("@prisma/client").$Enums.OrganizationType;
        email: string | null;
        id: string;
        createdAt: Date;
        updatedAt: Date;
        name: string;
        phone: string | null;
        address: string | null;
        city: string | null;
        state: string | null;
        country: string | null;
        gstin: string | null;
        pan: string | null;
        registeredAddress: string | null;
        pincode: string | null;
        logoUrl: string | null;
        website: string | null;
        isVerified: boolean;
        verifiedAt: Date | null;
        subscriptionPlan: string | null;
        subscriptionExpiry: Date | null;
        isActive: boolean;
    }>;
    create(dto: CreateOrganizationDto, user: AuthUser): Promise<{
        type: import("@prisma/client").$Enums.OrganizationType;
        email: string | null;
        id: string;
        createdAt: Date;
        updatedAt: Date;
        name: string;
        phone: string | null;
        address: string | null;
        city: string | null;
        state: string | null;
        country: string | null;
        gstin: string | null;
        pan: string | null;
        registeredAddress: string | null;
        pincode: string | null;
        logoUrl: string | null;
        website: string | null;
        isVerified: boolean;
        verifiedAt: Date | null;
        subscriptionPlan: string | null;
        subscriptionExpiry: Date | null;
        isActive: boolean;
    }>;
    update(organizationId: string, dto: UpdateOrganizationDto, user: AuthUser): Promise<{
        type: import("@prisma/client").$Enums.OrganizationType;
        email: string | null;
        id: string;
        createdAt: Date;
        updatedAt: Date;
        name: string;
        phone: string | null;
        address: string | null;
        city: string | null;
        state: string | null;
        country: string | null;
        gstin: string | null;
        pan: string | null;
        registeredAddress: string | null;
        pincode: string | null;
        logoUrl: string | null;
        website: string | null;
        isVerified: boolean;
        verifiedAt: Date | null;
        subscriptionPlan: string | null;
        subscriptionExpiry: Date | null;
        isActive: boolean;
    }>;
    verifyKyc(organizationId: string, user: AuthUser): Promise<{
        type: import("@prisma/client").$Enums.OrganizationType;
        email: string | null;
        id: string;
        createdAt: Date;
        updatedAt: Date;
        name: string;
        phone: string | null;
        address: string | null;
        city: string | null;
        state: string | null;
        country: string | null;
        gstin: string | null;
        pan: string | null;
        registeredAddress: string | null;
        pincode: string | null;
        logoUrl: string | null;
        website: string | null;
        isVerified: boolean;
        verifiedAt: Date | null;
        subscriptionPlan: string | null;
        subscriptionExpiry: Date | null;
        isActive: boolean;
    }>;
    inviteMembers(dto: InviteMembersDto, user: {
        id: string;
        organizationId: string;
    }): Promise<Record<string, unknown>[]>;
    private getTransporter;
    private sendInviteEmail;
    private sendAddedToOrgEmail;
    getJoinRequests(user: AuthUser): Promise<({
        user: {
            firstName: string;
            lastName: string | null;
            email: string | null;
            employeeCode: string | null;
            id: string;
            mobile: string | null;
        };
    } & {
        organizationId: string;
        roleCode: string;
        id: string;
        status: string;
        createdAt: Date;
        updatedAt: Date;
        userId: string;
    })[]>;
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
