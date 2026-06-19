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
    } & {
        id: string;
        organizationId: string;
        employeeCode: string | null;
        firstName: string;
        lastName: string | null;
        email: string | null;
        mobile: string | null;
        mobileVerified: boolean;
        passwordHash: string;
        pinHash: string | null;
        status: import("@prisma/client").$Enums.UserStatus;
        lastLoginAt: Date | null;
        createdAt: Date;
        updatedAt: Date;
        inviteToken: string | null;
        inviteExpiresAt: Date | null;
        userType: string | null;
        designation: string | null;
        profilePhotoUrl: string | null;
        preferredLanguage: string | null;
    }) | null>;
    findAll(actor: any): Promise<{
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
    createUser(dto: CreateUserDto, actor: any): Promise<{
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
    updateStatus(userId: string, status: UserStatus, actor: any): Promise<{
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
    findOne(userId: string, actor: any): Promise<{
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
    resetPin(userId: string, pin: string, actor: any): Promise<{
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
    updateProfile(userId: string, dto: UpdateProfileDto, actor: any): Promise<{
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
