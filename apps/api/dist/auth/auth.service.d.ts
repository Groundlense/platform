import { JwtService } from '@nestjs/jwt';
import { UsersService } from '../users/users.service';
import { DatabaseService } from '../database/database.service';
import { ActivityLogsService } from '../activity-logs/activity-logs.service';
import { RegisterDto } from './dto/register.dto';
import { SendOtpDto } from './dto/send-otp.dto';
import { VerifyOtpDto } from './dto/verify-otp.dto';
import { JoinRequestDto } from './dto/join-request.dto';
import { AcceptInviteDto } from './dto/accept-invite.dto';
export declare class AuthService {
    private readonly usersService;
    private readonly jwtService;
    private readonly db;
    private readonly activityLogsService;
    constructor(usersService: UsersService, jwtService: JwtService, db: DatabaseService, activityLogsService: ActivityLogsService);
    private hashToken;
    private generateRefreshToken;
    private issueTokens;
    login(identifier: string, password: string): Promise<{
        accessToken: string;
        refreshToken: string;
    }>;
    register(dto: RegisterDto): Promise<{
        accessToken: string;
        refreshToken: string;
    }>;
    refresh(refreshToken: string): Promise<{
        accessToken: string;
        refreshToken: string;
    }>;
    logout(refreshToken: string): Promise<{
        success: boolean;
    }>;
    private sendEmailOtp;
    private sendSmsOtp;
    sendOtp(dto: SendOtpDto): Promise<{
        success: boolean;
        message: string;
    }>;
    verifyOtp(dto: VerifyOtpDto): Promise<{
        success: boolean;
        message: string;
    }>;
    verifyGst(gstin: string): Promise<{
        success: boolean;
        exists: boolean;
        organizationId: string;
        legalName: string;
        state: string | null;
        city: string | null;
        type: import("@prisma/client").$Enums.OrganizationType;
        pan?: undefined;
    } | {
        success: boolean;
        exists: boolean;
        legalName: string;
        state: string;
        city: string;
        pan: string;
        organizationId?: undefined;
        type?: undefined;
    }>;
    getInviteDetails(token: string): Promise<{
        email: string | null;
        organizationName: string;
        roleCode: string;
        roleName: string;
    }>;
    acceptInvite(dto: AcceptInviteDto): Promise<{
        accessToken: string;
        refreshToken: string;
    }>;
    createJoinRequest(dto: JoinRequestDto): Promise<{
        success: boolean;
        message: string;
        employeeCode: string | null;
    }>;
    forgotPassword(email: string): Promise<{
        success: boolean;
        message: string;
    }>;
    resetPassword(email: string, code: string, newPassword: string): Promise<{
        success: boolean;
        message: string;
    }>;
}
