import { ProjectsService } from './projects.service';
import { CreateProjectDto } from './dto/create-project.dto';
import { UpdateProjectDto } from './dto/update-project.dto';
import { AddProjectMemberDto } from './dto/add-project-member.dto';
import { InviteProjectCompanyDto } from './dto/invite-project-company.dto';
import { RespondProjectCompanyDto } from './dto/respond-project-company.dto';
import { AssignProjectRoleDto } from './dto/assign-project-role.dto';
export declare class ProjectsController {
    private readonly projectsService;
    constructor(projectsService: ProjectsService);
    create(dto: CreateProjectDto, user: any): Promise<{
        name: string;
        description: string | null;
        id: string;
        status: import("@prisma/client").$Enums.ProjectStatus;
        createdAt: Date;
        updatedAt: Date;
        state: string | null;
        geotechOrganizationId: string | null;
        epcOrganizationId: string | null;
        projectCode: string;
        tenderId: string | null;
        createdByUserId: string;
        startDate: Date | null;
        endDate: Date | null;
        projectType: string | null;
        district: string | null;
        chainageFrom: import("@prisma/client/runtime/library").Decimal | null;
        chainageTo: import("@prisma/client/runtime/library").Decimal | null;
        initiatedByCompanyId: string | null;
        initiatedByUserId: string | null;
        billingCompanyId: string | null;
        totalBoringsPlanned: number | null;
        targetCompletionDate: Date | null;
        lockedAt: Date | null;
    }>;
    update(projectId: string, dto: UpdateProjectDto, user: any): Promise<{
        name: string;
        description: string | null;
        id: string;
        status: import("@prisma/client").$Enums.ProjectStatus;
        createdAt: Date;
        updatedAt: Date;
        state: string | null;
        geotechOrganizationId: string | null;
        epcOrganizationId: string | null;
        projectCode: string;
        tenderId: string | null;
        createdByUserId: string;
        startDate: Date | null;
        endDate: Date | null;
        projectType: string | null;
        district: string | null;
        chainageFrom: import("@prisma/client/runtime/library").Decimal | null;
        chainageTo: import("@prisma/client/runtime/library").Decimal | null;
        initiatedByCompanyId: string | null;
        initiatedByUserId: string | null;
        billingCompanyId: string | null;
        totalBoringsPlanned: number | null;
        targetCompletionDate: Date | null;
        lockedAt: Date | null;
    }>;
    findAll(user: any): Promise<({
        epcOrganization: {
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
        } | null;
        geotechOrganization: {
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
        } | null;
        initiatedByCompany: {
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
        } | null;
        billingCompany: {
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
        } | null;
    } & {
        name: string;
        description: string | null;
        id: string;
        status: import("@prisma/client").$Enums.ProjectStatus;
        createdAt: Date;
        updatedAt: Date;
        state: string | null;
        geotechOrganizationId: string | null;
        epcOrganizationId: string | null;
        projectCode: string;
        tenderId: string | null;
        createdByUserId: string;
        startDate: Date | null;
        endDate: Date | null;
        projectType: string | null;
        district: string | null;
        chainageFrom: import("@prisma/client/runtime/library").Decimal | null;
        chainageTo: import("@prisma/client/runtime/library").Decimal | null;
        initiatedByCompanyId: string | null;
        initiatedByUserId: string | null;
        billingCompanyId: string | null;
        totalBoringsPlanned: number | null;
        targetCompletionDate: Date | null;
        lockedAt: Date | null;
    })[]>;
    search(code: string, user: any): Promise<{
        found: boolean;
        hasAccess?: undefined;
        project?: undefined;
    } | {
        found: boolean;
        hasAccess: boolean;
        project: {
            name: string;
            id: string;
            status: import("@prisma/client").$Enums.ProjectStatus;
            state: string | null;
            projectCode: string;
            district: string | null;
        };
    }>;
    globalSearch(query: string, user: any): Promise<any[]>;
    getPendingProjectJoinRequests(user: any): Promise<({
        user: {
            organizationId: string;
            firstName: string;
            lastName: string | null;
            email: string | null;
            id: string;
        };
        organization: {
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
        };
        project: {
            createdBy: {
                organizationId: string;
                firstName: string;
                lastName: string | null;
                email: string | null;
                id: string;
            };
        } & {
            name: string;
            description: string | null;
            id: string;
            status: import("@prisma/client").$Enums.ProjectStatus;
            createdAt: Date;
            updatedAt: Date;
            state: string | null;
            geotechOrganizationId: string | null;
            epcOrganizationId: string | null;
            projectCode: string;
            tenderId: string | null;
            createdByUserId: string;
            startDate: Date | null;
            endDate: Date | null;
            projectType: string | null;
            district: string | null;
            chainageFrom: import("@prisma/client/runtime/library").Decimal | null;
            chainageTo: import("@prisma/client/runtime/library").Decimal | null;
            initiatedByCompanyId: string | null;
            initiatedByUserId: string | null;
            billingCompanyId: string | null;
            totalBoringsPlanned: number | null;
            targetCompletionDate: Date | null;
            lockedAt: Date | null;
        };
    } & {
        organizationId: string;
        id: string;
        status: string;
        createdAt: Date;
        updatedAt: Date;
        userId: string;
        projectId: string;
        isInvitation: boolean;
    })[]>;
    approveProjectJoinRequest(requestId: string, user: any): Promise<{
        success: boolean;
        message: string;
    }>;
    rejectProjectJoinRequest(requestId: string, user: any): Promise<{
        success: boolean;
        message: string;
    }>;
    createJoinRequest(projectId: string, user: any): Promise<{
        organizationId: string;
        id: string;
        status: string;
        createdAt: Date;
        updatedAt: Date;
        userId: string;
        projectId: string;
        isInvitation: boolean;
    }>;
    addMember(projectId: string, dto: AddProjectMemberDto, user: any): Promise<{
        id: string;
        createdAt: Date;
        userId: string;
        projectId: string;
    }>;
    getMembers(projectId: string, user: any): Promise<({
        user: {
            firstName: string;
            lastName: string | null;
            email: string | null;
            employeeCode: string | null;
            designation: string | null;
            userType: string | null;
            preferredLanguage: string | null;
            id: string;
        };
    } & {
        id: string;
        createdAt: Date;
        userId: string;
        projectId: string;
    })[]>;
    getMyProjects(user: any): Promise<({
        project: {
            epcOrganization: {
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
            } | null;
            geotechOrganization: {
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
            } | null;
        } & {
            name: string;
            description: string | null;
            id: string;
            status: import("@prisma/client").$Enums.ProjectStatus;
            createdAt: Date;
            updatedAt: Date;
            state: string | null;
            geotechOrganizationId: string | null;
            epcOrganizationId: string | null;
            projectCode: string;
            tenderId: string | null;
            createdByUserId: string;
            startDate: Date | null;
            endDate: Date | null;
            projectType: string | null;
            district: string | null;
            chainageFrom: import("@prisma/client/runtime/library").Decimal | null;
            chainageTo: import("@prisma/client/runtime/library").Decimal | null;
            initiatedByCompanyId: string | null;
            initiatedByUserId: string | null;
            billingCompanyId: string | null;
            totalBoringsPlanned: number | null;
            targetCompletionDate: Date | null;
            lockedAt: Date | null;
        };
    } & {
        id: string;
        createdAt: Date;
        userId: string;
        projectId: string;
    })[]>;
    inviteCompany(projectId: string, dto: InviteProjectCompanyDto, user: any): Promise<{
        company: {
            name: string;
            type: import("@prisma/client").$Enums.OrganizationType;
            id: string;
            city: string | null;
        };
    } & {
        role: import("@prisma/client").$Enums.ProjectCompanyRole;
        id: string;
        createdAt: Date;
        isActive: boolean;
        projectId: string;
        companyId: string;
        invitedByUserId: string | null;
        inviteAcceptedAt: Date | null;
    }>;
    getCompanies(projectId: string, user: any): Promise<({
        company: {
            name: string;
            type: import("@prisma/client").$Enums.OrganizationType;
            id: string;
            city: string | null;
        };
    } & {
        role: import("@prisma/client").$Enums.ProjectCompanyRole;
        id: string;
        createdAt: Date;
        isActive: boolean;
        projectId: string;
        companyId: string;
        invitedByUserId: string | null;
        inviteAcceptedAt: Date | null;
    })[]>;
    respondToCompanyInvite(projectId: string, companyLinkId: string, dto: RespondProjectCompanyDto, user: any): Promise<{
        role: import("@prisma/client").$Enums.ProjectCompanyRole;
        id: string;
        createdAt: Date;
        isActive: boolean;
        projectId: string;
        companyId: string;
        invitedByUserId: string | null;
        inviteAcceptedAt: Date | null;
    }>;
    removeCompanyLink(projectId: string, companyLinkId: string, user: any): Promise<{
        removed: boolean;
    }>;
    assignUserRole(projectId: string, dto: AssignProjectRoleDto, user: any): Promise<{
        role: {
            name: string;
            id: string;
            code: string;
        };
    } & {
        id: string;
        userId: string;
        roleId: string;
        projectId: string;
        companyId: string;
        assignedByUserId: string | null;
        assignedAt: Date;
        revokedAt: Date | null;
    }>;
    getUserRoles(projectId: string, user: any): Promise<({
        user: {
            firstName: string;
            lastName: string | null;
            employeeCode: string | null;
            id: string;
        };
        role: {
            name: string;
            id: string;
            code: string;
        };
        company: {
            name: string;
            id: string;
        };
    } & {
        id: string;
        userId: string;
        roleId: string;
        projectId: string;
        companyId: string;
        assignedByUserId: string | null;
        assignedAt: Date;
        revokedAt: Date | null;
    })[]>;
}
