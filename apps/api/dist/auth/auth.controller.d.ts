import { AuthService } from './auth.service';
import { LoginDto } from './dto/login.dto';
import { RefreshTokenDto } from './dto/refresh-token.dto';
import { RegisterDto } from './dto/register.dto';
import { SendOtpDto } from './dto/send-otp.dto';
import { VerifyOtpDto } from './dto/verify-otp.dto';
import { JoinRequestDto } from './dto/join-request.dto';
import { AcceptInviteDto } from './dto/accept-invite.dto';
import { ForgotPasswordDto } from './dto/forgot-password.dto';
import { ResetPasswordDto } from './dto/reset-password.dto';
import type { Response } from 'express';
export declare class AuthController {
    private readonly authService;
    constructor(authService: AuthService);
    login(dto: LoginDto): Promise<{
        accessToken: string;
        refreshToken: string;
    }>;
    register(dto: RegisterDto): Promise<{
        accessToken: string;
        refreshToken: string;
    }>;
    refresh(dto: RefreshTokenDto): Promise<{
        accessToken: string;
        refreshToken: string;
    }>;
    logout(dto: RefreshTokenDto): Promise<{
        success: boolean;
    }>;
    getProfile(user: Record<string, unknown>): Record<string, unknown>;
    sendOtp(dto: SendOtpDto): Promise<{
        success: boolean;
        message: string;
        isMock: boolean;
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
    uploadLogo(file: Express.Multer.File): {
        success: boolean;
        filename: string;
        url: string;
    };
    getLogo(filename: string, res: Response): void;
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
    joinRequest(dto: JoinRequestDto): Promise<{
        success: boolean;
        message: string;
        employeeCode: string | null;
    }>;
    forgotPassword(dto: ForgotPasswordDto): Promise<{
        success: boolean;
        message: string;
    }>;
    resetPassword(dto: ResetPasswordDto): Promise<{
        success: boolean;
        message: string;
    }>;
}
