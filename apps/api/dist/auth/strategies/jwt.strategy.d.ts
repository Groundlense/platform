import { Strategy } from 'passport-jwt';
import { DatabaseService } from '../../database/database.service';
declare const JwtStrategy_base: new (...args: [opt: import("passport-jwt").StrategyOptionsWithRequest] | [opt: import("passport-jwt").StrategyOptionsWithoutRequest]) => Strategy & {
    validate(...args: any[]): unknown;
};
export declare class JwtStrategy extends JwtStrategy_base {
    private readonly db;
    constructor(db: DatabaseService);
    validate(payload: any): Promise<{
        id: string;
        organizationId: string;
        firstName: string;
        lastName: string | null;
        employeeCode: string | null;
        email: string | null;
        organization: {
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
        };
        roles: string[];
        permissions: string[];
    }>;
}
export {};
