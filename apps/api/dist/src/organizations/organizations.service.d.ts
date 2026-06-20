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
        id: string;
        name: string;
        type: import("@prisma/client").$Enums.OrganizationType;
        city: string | null;
        state: string | null;
    }[]>;
    findOne(organizationId: string, user: AuthUser): Promise<{
        id: string;
        email: string | null;
        createdAt: Date;
        updatedAt: Date;
        name: string;
        type: import("@prisma/client").$Enums.OrganizationType;
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
        id: string;
        email: string | null;
        createdAt: Date;
        updatedAt: Date;
        name: string;
        type: import("@prisma/client").$Enums.OrganizationType;
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
        id: string;
        email: string | null;
        createdAt: Date;
        updatedAt: Date;
        name: string;
        type: import("@prisma/client").$Enums.OrganizationType;
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
        id: string;
        email: string | null;
        createdAt: Date;
        updatedAt: Date;
        name: string;
        type: import("@prisma/client").$Enums.OrganizationType;
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
            id: string;
            employeeCode: string | null;
            firstName: string;
            lastName: string | null;
            email: string | null;
            mobile: string | null;
        };
    } & {
        id: string;
        organizationId: string;
        status: string;
        createdAt: Date;
        updatedAt: Date;
        userId: string;
        roleCode: string;
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
