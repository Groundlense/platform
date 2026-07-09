import { UsersService } from './users.service';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserStatusDto } from './dto/update-user-status.dto';
import { ResetPinDto } from './dto/reset-pin.dto';
import { UpdateProfileDto } from './dto/update-profile.dto';
export declare class UsersController {
    private readonly usersService;
    constructor(usersService: UsersService);
    findAll(user: any): Promise<{
        organizationId: string;
        firstName: string;
        lastName: string | null;
        email: string | null;
        employeeCode: string | null;
        designation: string | null;
        userType: string | null;
        preferredLanguage: string | null;
        mobile: string | null;
        id: string;
        mobileVerified: boolean;
        status: import("@prisma/client").$Enums.UserStatus;
        lastLoginAt: Date | null;
        createdAt: Date;
        updatedAt: Date;
        profilePhotoUrl: string | null;
        roles: ({
            role: {
                name: string;
                description: string | null;
                id: string;
                createdAt: Date;
                updatedAt: Date;
                code: string;
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
        isExisting: boolean;
        roles: ({
            role: {
                name: string;
                description: string | null;
                id: string;
                createdAt: Date;
                updatedAt: Date;
                code: string;
                scope: import("@prisma/client").$Enums.ScopeType;
                isSystemRole: boolean;
            };
        } & {
            id: string;
            createdAt: Date;
            userId: string;
            roleId: string;
        })[];
        organizationId: string;
        firstName: string;
        lastName: string | null;
        email: string | null;
        employeeCode: string | null;
        designation: string | null;
        userType: string | null;
        preferredLanguage: string | null;
        mobile: string | null;
        id: string;
        inviteToken: string | null;
        mobileVerified: boolean;
        passwordHash: string;
        pinHash: string | null;
        status: import("@prisma/client").$Enums.UserStatus;
        lastLoginAt: Date | null;
        createdAt: Date;
        updatedAt: Date;
        inviteExpiresAt: Date | null;
        profilePhotoUrl: string | null;
        user?: undefined;
        oneTimePassword?: undefined;
    } | {
        user: {
            organizationId: string;
            firstName: string;
            lastName: string | null;
            email: string | null;
            employeeCode: string | null;
            designation: string | null;
            userType: string | null;
            preferredLanguage: string | null;
            mobile: string | null;
            id: string;
            mobileVerified: boolean;
            status: import("@prisma/client").$Enums.UserStatus;
            lastLoginAt: Date | null;
            createdAt: Date;
            updatedAt: Date;
            profilePhotoUrl: string | null;
        };
        oneTimePassword: string;
    }>;
    updateStatus(userId: string, dto: UpdateUserStatusDto, user: any): Promise<{
        organizationId: string;
        firstName: string;
        lastName: string | null;
        email: string | null;
        employeeCode: string | null;
        designation: string | null;
        userType: string | null;
        preferredLanguage: string | null;
        mobile: string | null;
        id: string;
        mobileVerified: boolean;
        status: import("@prisma/client").$Enums.UserStatus;
        lastLoginAt: Date | null;
        createdAt: Date;
        updatedAt: Date;
        profilePhotoUrl: string | null;
    }>;
    findOne(userId: string, user: any): Promise<{
        organizationId: string;
        firstName: string;
        lastName: string | null;
        email: string | null;
        employeeCode: string | null;
        designation: string | null;
        userType: string | null;
        preferredLanguage: string | null;
        mobile: string | null;
        id: string;
        mobileVerified: boolean;
        status: import("@prisma/client").$Enums.UserStatus;
        lastLoginAt: Date | null;
        createdAt: Date;
        updatedAt: Date;
        profilePhotoUrl: string | null;
        roles: ({
            role: {
                name: string;
                description: string | null;
                id: string;
                createdAt: Date;
                updatedAt: Date;
                code: string;
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
                name: string;
                description: string | null;
                organizationId: string;
                id: string;
                createdAt: Date;
                updatedAt: Date;
                isActive: boolean;
                code: string;
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
        organizationId: string;
        firstName: string;
        lastName: string | null;
        email: string | null;
        employeeCode: string | null;
        designation: string | null;
        userType: string | null;
        preferredLanguage: string | null;
        mobile: string | null;
        id: string;
        mobileVerified: boolean;
        status: import("@prisma/client").$Enums.UserStatus;
        lastLoginAt: Date | null;
        createdAt: Date;
        updatedAt: Date;
        profilePhotoUrl: string | null;
    }>;
    updateProfile(userId: string, dto: UpdateProfileDto, user: any): Promise<{
        organizationId: string;
        firstName: string;
        lastName: string | null;
        email: string | null;
        employeeCode: string | null;
        designation: string | null;
        userType: string | null;
        preferredLanguage: string | null;
        mobile: string | null;
        id: string;
        mobileVerified: boolean;
        status: import("@prisma/client").$Enums.UserStatus;
        lastLoginAt: Date | null;
        createdAt: Date;
        updatedAt: Date;
        profilePhotoUrl: string | null;
    }>;
}
