import { UsersService } from './users.service';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserStatusDto } from './dto/update-user-status.dto';
import { ResetPinDto } from './dto/reset-pin.dto';
export declare class UsersController {
    private readonly usersService;
    constructor(usersService: UsersService);
    findAll(user: any): Promise<{
        id: string;
        organizationId: string;
        employeeCode: string | null;
        firstName: string;
        lastName: string | null;
        email: string | null;
        mobile: string | null;
        mobileVerified: boolean;
        status: import("@prisma/client").$Enums.UserStatus;
        lastLoginAt: Date | null;
        createdAt: Date;
        updatedAt: Date;
        userType: string | null;
        designation: string | null;
        profilePhotoUrl: string | null;
        preferredLanguage: string | null;
        roles: ({
            role: {
                id: string;
                createdAt: Date;
                updatedAt: Date;
                name: string;
                code: string;
                description: string | null;
                scope: import("@prisma/client").$Enums.ScopeType;
                isSystemRole: boolean;
            };
        } & {
            id: string;
            createdAt: Date;
            userId: string;
            roleId: string;
        })[];
    }[]>;
    createUser(dto: CreateUserDto, user: any): Promise<{
        user: {
            id: string;
            organizationId: string;
            employeeCode: string | null;
            firstName: string;
            lastName: string | null;
            email: string | null;
            mobile: string | null;
            mobileVerified: boolean;
            status: import("@prisma/client").$Enums.UserStatus;
            lastLoginAt: Date | null;
            createdAt: Date;
            updatedAt: Date;
            userType: string | null;
            designation: string | null;
            profilePhotoUrl: string | null;
            preferredLanguage: string | null;
        };
        oneTimePassword: string;
    }>;
    updateStatus(userId: string, dto: UpdateUserStatusDto, user: any): Promise<{
        id: string;
        organizationId: string;
        employeeCode: string | null;
        firstName: string;
        lastName: string | null;
        email: string | null;
        mobile: string | null;
        mobileVerified: boolean;
        status: import("@prisma/client").$Enums.UserStatus;
        lastLoginAt: Date | null;
        createdAt: Date;
        updatedAt: Date;
        userType: string | null;
        designation: string | null;
        profilePhotoUrl: string | null;
        preferredLanguage: string | null;
    }>;
    findOne(userId: string, user: any): Promise<{
        id: string;
        organizationId: string;
        employeeCode: string | null;
        firstName: string;
        lastName: string | null;
        email: string | null;
        mobile: string | null;
        mobileVerified: boolean;
        status: import("@prisma/client").$Enums.UserStatus;
        lastLoginAt: Date | null;
        createdAt: Date;
        updatedAt: Date;
        userType: string | null;
        designation: string | null;
        profilePhotoUrl: string | null;
        preferredLanguage: string | null;
        roles: ({
            role: {
                id: string;
                createdAt: Date;
                updatedAt: Date;
                name: string;
                code: string;
                description: string | null;
                scope: import("@prisma/client").$Enums.ScopeType;
                isSystemRole: boolean;
            };
        } & {
            id: string;
            createdAt: Date;
            userId: string;
            roleId: string;
        })[];
        teamMemberships: ({
            team: {
                id: string;
                organizationId: string;
                createdAt: Date;
                updatedAt: Date;
                name: string;
                isActive: boolean;
                code: string;
                description: string | null;
                projectId: string | null;
                teamPrefix: string | null;
                supervisorUserId: string | null;
                notificationSent: boolean;
            };
        } & {
            id: string;
            createdAt: Date;
            userId: string;
            teamId: string;
        })[];
    } | null>;
    resetPin(userId: string, dto: ResetPinDto, user: any): Promise<{
        id: string;
        organizationId: string;
        employeeCode: string | null;
        firstName: string;
        lastName: string | null;
        email: string | null;
        mobile: string | null;
        mobileVerified: boolean;
        status: import("@prisma/client").$Enums.UserStatus;
        lastLoginAt: Date | null;
        createdAt: Date;
        updatedAt: Date;
        userType: string | null;
        designation: string | null;
        profilePhotoUrl: string | null;
        preferredLanguage: string | null;
    }>;
}
