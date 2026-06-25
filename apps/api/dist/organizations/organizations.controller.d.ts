import { OrganizationsService } from './organizations.service';
import { CreateOrganizationDto } from './dto/create-organization.dto';
import { UpdateOrganizationDto } from './dto/update-organization.dto';
import { ListOrganizationsQueryDto } from './dto/list-organizations-query.dto';
import { InviteMembersDto } from './dto/invite-members.dto';
export declare class OrganizationsController {
    private readonly organizationsService;
    constructor(organizationsService: OrganizationsService);
    findAll(query: ListOrganizationsQueryDto): Promise<{
        name: string;
        type: import("@prisma/client").$Enums.OrganizationType;
        id: string;
        city: string | null;
        state: string | null;
    }[]>;
    create(dto: CreateOrganizationDto, user: {
        id: string;
        organizationId: string;
        roles?: any;
    }): Promise<{
        name: string;
        type: import("@prisma/client").$Enums.OrganizationType;
        email: string | null;
        id: string;
        createdAt: Date;
        updatedAt: Date;
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
    findOne(organizationId: string, user: {
        id: string;
        organizationId: string;
        roles?: any;
    }): Promise<{
        name: string;
        type: import("@prisma/client").$Enums.OrganizationType;
        email: string | null;
        id: string;
        createdAt: Date;
        updatedAt: Date;
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
    update(organizationId: string, dto: UpdateOrganizationDto, user: {
        id: string;
        organizationId: string;
        roles?: any;
    }): Promise<{
        name: string;
        type: import("@prisma/client").$Enums.OrganizationType;
        email: string | null;
        id: string;
        createdAt: Date;
        updatedAt: Date;
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
    verifyKyc(organizationId: string, user: {
        id: string;
        organizationId: string;
        roles?: any;
    }): Promise<{
        name: string;
        type: import("@prisma/client").$Enums.OrganizationType;
        email: string | null;
        id: string;
        createdAt: Date;
        updatedAt: Date;
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
        roles?: any;
    }): Promise<Record<string, unknown>[]>;
    getJoinRequests(user: {
        id: string;
        organizationId: string;
        roles?: any;
    }): Promise<({
        user: {
            firstName: string;
            lastName: string | null;
            email: string | null;
            employeeCode: string | null;
            mobile: string | null;
            id: string;
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
