import { DatabaseService } from '../database/database.service';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateProfileDto } from './dto/update-profile.dto';
import { UserStatus } from '@prisma/client';
export declare class UsersService {
    private readonly db;
    constructor(db: DatabaseService);
    private isSuperAdmin;
    private assertSameOrganization;
    findByIdentifier(identifier: string): Promise<({
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
    } & {
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
    }) | null>;
    findByMobile(mobile: string): Promise<{
        found: boolean;
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
        } | null;
    }>;
    findAll(actor: any): Promise<{
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
    createUser(dto: CreateUserDto, actor: any): Promise<{
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
    updateStatus(userId: string, status: UserStatus, actor: any): Promise<{
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
    findOne(userId: string, actor: any): Promise<{
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
    resetPin(userId: string, pin: string, actor: any): Promise<{
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
    updateProfile(userId: string, dto: UpdateProfileDto, actor: any): Promise<{
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
