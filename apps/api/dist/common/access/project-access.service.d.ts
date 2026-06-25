import { DatabaseService } from '../../database/database.service';
export declare class ProjectAccessService {
    private readonly db;
    constructor(db: DatabaseService);
    isSuperAdmin(user: any): boolean;
    projectScopeWhere(user: any): {
        OR?: undefined;
    } | {
        OR: ({
            epcOrganizationId: any;
            geotechOrganizationId?: undefined;
            members?: undefined;
            projectCompanies?: undefined;
            userProjectRoles?: undefined;
        } | {
            geotechOrganizationId: any;
            epcOrganizationId?: undefined;
            members?: undefined;
            projectCompanies?: undefined;
            userProjectRoles?: undefined;
        } | {
            members: {
                some: {
                    userId: any;
                };
            };
            epcOrganizationId?: undefined;
            geotechOrganizationId?: undefined;
            projectCompanies?: undefined;
            userProjectRoles?: undefined;
        } | {
            projectCompanies: {
                some: {
                    companyId: any;
                    isActive: boolean;
                    inviteAcceptedAt: {
                        not: null;
                    };
                };
            };
            epcOrganizationId?: undefined;
            geotechOrganizationId?: undefined;
            members?: undefined;
            userProjectRoles?: undefined;
        } | {
            userProjectRoles: {
                some: {
                    userId: any;
                    revokedAt: null;
                };
            };
            epcOrganizationId?: undefined;
            geotechOrganizationId?: undefined;
            members?: undefined;
            projectCompanies?: undefined;
        })[];
    };
    canAccessProject(user: any, projectId: string): Promise<boolean>;
    assertProjectAccess(user: any, projectId: string): Promise<void>;
    assertBoreholeAccess(user: any, boreholeId: string): Promise<{
        name: string | null;
        id: string;
        status: import("@prisma/client").$Enums.BoreholeStatus;
        createdAt: Date;
        updatedAt: Date;
        createdByUserId: string;
        lockedAt: Date | null;
        projectId: string;
        siteId: string | null;
        boreholeCode: string;
        teamId: string | null;
        latitude: import("@prisma/client/runtime/library").Decimal | null;
        longitude: import("@prisma/client/runtime/library").Decimal | null;
        groundLevelRL: import("@prisma/client/runtime/library").Decimal | null;
        plannedDepth: import("@prisma/client/runtime/library").Decimal | null;
        finalDepth: import("@prisma/client/runtime/library").Decimal | null;
        startedAt: Date | null;
        completedAt: Date | null;
        assignedWorkerId: string | null;
        method: import("@prisma/client").$Enums.BoringMethod | null;
        rigType: string | null;
        startDepth: import("@prisma/client/runtime/library").Decimal | null;
    }>;
    assertIntervalAccess(user: any, intervalId: string): Promise<{
        borehole: {
            projectId: string;
        };
    } & {
        soilDescription: string | null;
        id: string;
        createdAt: Date;
        updatedAt: Date;
        boreholeId: string;
        intervalNo: number;
        fromDepth: import("@prisma/client/runtime/library").Decimal;
        toDepth: import("@prisma/client/runtime/library").Decimal;
        nValue: number | null;
        remarks: string | null;
        isCompleted: boolean;
        blow1: number | null;
        blow2: number | null;
        blow3: number | null;
        nCorrected: number | null;
        isRefusal: boolean;
        penetrationMm: number | null;
        dilatancyApplied: boolean;
        gpsLat: import("@prisma/client/runtime/library").Decimal | null;
        gpsLng: import("@prisma/client/runtime/library").Decimal | null;
        observedAt: Date | null;
        prevHash: string | null;
        sha256Hash: string | null;
        recordedByUserId: string | null;
    }>;
    getProjectRole(user: any, projectId: string): Promise<string | null>;
    assertProjectRole(user: any, projectId: string, allowed: string[]): Promise<void>;
    assertSameOrganization(user: any, organizationId: string): void;
}
