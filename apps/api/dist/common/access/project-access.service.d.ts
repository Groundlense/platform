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
    assertBoreholeAccess(user: any, boreholeId: string): Promise<any>;
    assertIntervalAccess(user: any, intervalId: string): Promise<any>;
    getProjectRole(user: any, projectId: string): Promise<string | null>;
    assertProjectRole(user: any, projectId: string, allowed: string[]): Promise<void>;
    assertSameOrganization(user: any, organizationId: string): void;
}
