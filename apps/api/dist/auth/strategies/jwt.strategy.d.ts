import { DatabaseService } from '../../database/database.service';
declare const JwtStrategy_base: new (...args: any) => any;
export declare class JwtStrategy extends JwtStrategy_base {
    private readonly db;
    constructor(db: DatabaseService);
    validate(payload: any): Promise<{
        id: any;
        organizationId: any;
        firstName: any;
        lastName: any;
        employeeCode: any;
        email: any;
        organization: any;
        roles: any;
        permissions: any;
    }>;
}
export {};
