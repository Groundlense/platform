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
    create(dto: CreateProjectDto, userId: string, organizationId: string): Promise<{
        id: string;
        status: import("@prisma/client").$Enums.ProjectStatus;
        createdAt: Date;
        updatedAt: Date;
        name: string;
        state: string | null;
        description: string | null;
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
        } | null;
        geotechOrganization: {
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
        } | null;
    } & {
        id: string;
        status: import("@prisma/client").$Enums.ProjectStatus;
        createdAt: Date;
        updatedAt: Date;
        name: string;
        state: string | null;
        description: string | null;
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
    searchByCode(code: string, user: any): Promise<{
        found: boolean;
        hasAccess?: undefined;
        project?: undefined;
    } | {
        found: boolean;
        hasAccess: boolean;
        project: {
            id: string;
            status: import("@prisma/client").$Enums.ProjectStatus;
            name: string;
            state: string | null;
            projectCode: string;
            district: string | null;
        };
    }>;
    addMember(projectId: string, userId: string, actor: any): Promise<{
        id: string;
        createdAt: Date;
        userId: string;
        projectId: string;
    }>;
    getMembers(projectId: string, actor: any): Promise<({
        user: {
            id: string;
            employeeCode: string | null;
            firstName: string;
            lastName: string | null;
            email: string | null;
            userType: string | null;
            designation: string | null;
            preferredLanguage: string | null;
        };
    } & {
        id: string;
        createdAt: Date;
        userId: string;
        projectId: string;
    })[]>;
    getMyProjects(userId: string): Promise<({
        project: {
            epcOrganization: {
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
            } | null;
            geotechOrganization: {
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
            } | null;
        } & {
            id: string;
            status: import("@prisma/client").$Enums.ProjectStatus;
            createdAt: Date;
            updatedAt: Date;
            name: string;
            state: string | null;
            description: string | null;
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
    inviteCompany(projectId: string, dto: InviteProjectCompanyDto, actor: any): Promise<{
        company: {
            id: string;
            name: string;
            type: import("@prisma/client").$Enums.OrganizationType;
            city: string | null;
        };
    } & {
        id: string;
        createdAt: Date;
        role: import("@prisma/client").$Enums.ProjectCompanyRole;
        isActive: boolean;
        projectId: string;
        companyId: string;
        invitedByUserId: string | null;
        inviteAcceptedAt: Date | null;
    }>;
    getCompanies(projectId: string, actor: any): Promise<({
        company: {
            id: string;
            name: string;
            type: import("@prisma/client").$Enums.OrganizationType;
            city: string | null;
        };
    } & {
        id: string;
        createdAt: Date;
        role: import("@prisma/client").$Enums.ProjectCompanyRole;
        isActive: boolean;
        projectId: string;
        companyId: string;
        invitedByUserId: string | null;
        inviteAcceptedAt: Date | null;
    })[]>;
    respondToCompanyInvite(projectId: string, companyLinkId: string, accept: boolean, actor: any): Promise<{
        id: string;
        createdAt: Date;
        role: import("@prisma/client").$Enums.ProjectCompanyRole;
        isActive: boolean;
        projectId: string;
        companyId: string;
        invitedByUserId: string | null;
        inviteAcceptedAt: Date | null;
    }>;
    removeCompanyLink(projectId: string, companyLinkId: string, actor: any): Promise<{
        removed: boolean;
    }>;
    assignUserRole(projectId: string, dto: AssignProjectRoleDto, actor: any): Promise<{
        role: {
            id: string;
            name: string;
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
    getUserRoles(projectId: string, actor: any): Promise<({
        user: {
            id: string;
            employeeCode: string | null;
            firstName: string;
            lastName: string | null;
        };
        role: {
            id: string;
            name: string;
            code: string;
        };
        company: {
            id: string;
            name: string;
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
    globalSearch(query: string, user: any): Promise<any[]>;
    createJoinRequest(projectId: string, user: any): Promise<{
        id: string;
        organizationId: string;
        status: string;
        createdAt: Date;
        updatedAt: Date;
        userId: string;
        projectId: string;
        isInvitation: boolean;
    }>;
    getPendingProjectJoinRequests(user: any): Promise<({
        user: {
            id: string;
            organizationId: string;
            firstName: string;
            lastName: string | null;
            email: string | null;
        };
        organization: {
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
        };
        project: {
            createdBy: {
                id: string;
                organizationId: string;
                firstName: string;
                lastName: string | null;
                email: string | null;
            };
        } & {
            id: string;
            status: import("@prisma/client").$Enums.ProjectStatus;
            createdAt: Date;
            updatedAt: Date;
            name: string;
            state: string | null;
            description: string | null;
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
        organizationId: string;
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
    private getTransporter;
    private sendMail;
}
