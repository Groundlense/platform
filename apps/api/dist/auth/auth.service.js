"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.AuthService = void 0;
const common_1 = require("@nestjs/common");
const jwt_1 = require("@nestjs/jwt");
const email_helper_1 = require("../common/email.helper");
const bcrypt = __importStar(require("bcrypt"));
const crypto = __importStar(require("crypto"));
const users_service_1 = require("../users/users.service");
const database_service_1 = require("../database/database.service");
const activity_logs_service_1 = require("../activity-logs/activity-logs.service");
const notifications_service_1 = require("../notifications/notifications.service");
let AuthService = class AuthService {
    usersService;
    jwtService;
    db;
    activityLogsService;
    notificationsService;
    constructor(usersService, jwtService, db, activityLogsService, notificationsService) {
        this.usersService = usersService;
        this.jwtService = jwtService;
        this.db = db;
        this.activityLogsService = activityLogsService;
        this.notificationsService = notificationsService;
    }
    hashToken(token) {
        return crypto.createHash('sha256').update(token).digest('hex');
    }
    generateRefreshToken() {
        return crypto.randomBytes(48).toString('base64url');
    }
    async issueTokens(userId, organizationId) {
        const accessToken = await this.jwtService.signAsync({
            sub: userId,
            organizationId,
        });
        const refreshToken = this.generateRefreshToken();
        await this.db.refreshToken.create({
            data: {
                userId,
                tokenHash: this.hashToken(refreshToken),
                expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
            },
        });
        return {
            accessToken,
            refreshToken,
        };
    }
    async login(identifier, password) {
        const user = await this.usersService.findByIdentifier(identifier);
        if (!user) {
            throw new common_1.UnauthorizedException('Invalid credentials');
        }
        if (user.status !== 'ACTIVE') {
            throw new common_1.UnauthorizedException('User account inactive');
        }
        let valid = await bcrypt.compare(password, user.passwordHash);
        if (!valid && user.pinHash) {
            valid = await bcrypt.compare(password, user.pinHash);
        }
        if (!valid) {
            throw new common_1.UnauthorizedException('Invalid credentials');
        }
        await this.activityLogsService.log(user.id, 'LOGIN', 'USER', user.id);
        return this.issueTokens(user.id, user.organizationId);
    }
    async register(dto) {
        const emailOtp = await this.db.otp.findUnique({
            where: { type_target: { type: 'EMAIL', target: dto.admin.email } },
        });
        if (!emailOtp || !emailOtp.verified || emailOtp.expiresAt < new Date()) {
            throw new common_1.BadRequestException('Email OTP verification required');
        }
        const existingUser = await this.db.user.findUnique({
            where: { email: dto.admin.email },
            select: { id: true },
        });
        if (existingUser) {
            throw new common_1.ConflictException('A user with this email already exists');
        }
        if (dto.organization.gstin) {
            const existingOrg = await this.db.organization.findFirst({
                where: { gstin: dto.organization.gstin },
                select: { id: true },
            });
            if (existingOrg) {
                throw new common_1.ConflictException('An organization with this GSTIN already exists');
            }
        }
        const roleCode = dto.organization.type === 'EPC_CONTRACTOR'
            ? 'EPC_ADMIN'
            : 'GEOTECH_ADMIN';
        const passwordHash = await bcrypt.hash(dto.admin.password, 10);
        const user = await this.db.$transaction(async (tx) => {
            const organization = await tx.organization.create({
                data: {
                    name: dto.organization.name,
                    type: dto.organization.type,
                    gstin: dto.organization.gstin,
                    email: dto.organization.email,
                    phone: dto.organization.phone,
                    city: dto.organization.city,
                    state: dto.organization.state,
                    logoUrl: dto.organization.logoUrl || null,
                },
            });
            let prefix = 'GL-USER';
            if (dto.organization.type === 'EPC_CONTRACTOR') {
                prefix = 'GL-CON';
            }
            else if (dto.organization.type === 'GEOTECH_CONTRACTOR') {
                prefix = 'GL-GEO';
            }
            else if (dto.organization.type === 'CLIENT') {
                prefix = 'GL-CL';
            }
            else if (dto.organization.type === 'NABL_LAB') {
                prefix = 'GL-LAB';
            }
            else if (dto.organization.type === 'IE_FIRM') {
                prefix = 'GL-ENG';
            }
            else if (dto.organization.type === 'STRUCTURAL_CONSULTANT') {
                prefix = 'GL-STR';
            }
            let employeeCode = '';
            let isUnique = false;
            let attempts = 0;
            while (!isUnique && attempts < 10) {
                const randNum = Math.floor(1000 + Math.random() * 9000);
                employeeCode = `${prefix}-${randNum}`;
                const existing = await tx.user.findUnique({
                    where: { employeeCode },
                });
                if (!existing) {
                    isUnique = true;
                }
                attempts++;
            }
            const admin = await tx.user.create({
                data: {
                    organizationId: organization.id,
                    employeeCode: isUnique ? employeeCode : null,
                    firstName: dto.admin.firstName,
                    lastName: dto.admin.lastName,
                    email: dto.admin.email,
                    mobile: dto.admin.mobile,
                    passwordHash,
                    status: 'ACTIVE',
                },
            });
            const role = await tx.role.findUnique({
                where: { code: roleCode },
            });
            if (role) {
                await tx.userRole.create({
                    data: {
                        userId: admin.id,
                        roleId: role.id,
                    },
                });
            }
            const pendingInvites = await tx.projectInvitation.findMany({
                where: {
                    email: dto.admin.email,
                    status: 'PENDING',
                },
            });
            for (const invite of pendingInvites) {
                const updateData = {};
                if (dto.organization.type === 'GEOTECH_CONTRACTOR') {
                    updateData.geotechOrganizationId = organization.id;
                }
                else if (dto.organization.type === 'EPC_CONTRACTOR') {
                    updateData.epcOrganizationId = organization.id;
                }
                await tx.project.update({
                    where: { id: invite.projectId },
                    data: updateData,
                });
                await tx.projectMember.upsert({
                    where: {
                        projectId_userId: {
                            projectId: invite.projectId,
                            userId: admin.id,
                        },
                    },
                    create: {
                        projectId: invite.projectId,
                        userId: admin.id,
                    },
                    update: {},
                });
                await tx.projectInvitation.update({
                    where: { id: invite.id },
                    data: { status: 'ACCEPTED' },
                });
            }
            return admin;
        });
        await this.activityLogsService.log(user.id, 'REGISTER', 'ORGANIZATION', user.organizationId, {
            organizationName: dto.organization.name,
            organizationType: dto.organization.type,
            adminRole: roleCode,
        });
        return this.issueTokens(user.id, user.organizationId);
    }
    async refresh(refreshToken) {
        const matchedToken = await this.db.refreshToken.findFirst({
            where: {
                tokenHash: this.hashToken(refreshToken),
                revokedAt: null,
                expiresAt: {
                    gt: new Date(),
                },
            },
            include: {
                user: true,
            },
        });
        if (!matchedToken) {
            throw new common_1.UnauthorizedException('Invalid refresh token');
        }
        await this.db.refreshToken.update({
            where: {
                id: matchedToken.id,
            },
            data: {
                revokedAt: new Date(),
            },
        });
        return this.issueTokens(matchedToken.user.id, matchedToken.user.organizationId);
    }
    async logout(refreshToken) {
        const token = await this.db.refreshToken.findFirst({
            where: {
                tokenHash: this.hashToken(refreshToken),
                revokedAt: null,
            },
        });
        if (!token) {
            throw new common_1.UnauthorizedException('Invalid refresh token');
        }
        await this.db.refreshToken.update({
            where: {
                id: token.id,
            },
            data: {
                revokedAt: new Date(),
            },
        });
        return {
            success: true,
        };
    }
    async sendEmailOtp(email, code) {
        const subject = 'Your GroundLense Verification OTP';
        const text = `Your GroundLense OTP is ${code}. It is valid for 5 minutes.`;
        const html = `
      <div style="font-family: sans-serif; padding: 20px; color: #333;">
        <h2 style="color: #4f46e5;">GroundLense Verification</h2>
        <p>Please use the following One-Time Password (OTP) to complete your verification:</p>
        <div style="font-size: 28px; font-weight: bold; background: #f3f4f6; padding: 15px; text-align: center; border-radius: 8px; letter-spacing: 4px; margin: 20px 0;">
          ${code}
        </div>
        <p style="font-size: 14px; color: #6b7280;">This OTP is valid for 5 minutes. Please do not share it with anyone.</p>
      </div>
    `;
        await (0, email_helper_1.sendEmail)({
            to: email,
            subject,
            text,
            html,
        });
    }
    async sendSmsOtp(mobile, code) {
        const accountSid = process.env.TWILIO_ACCOUNT_SID;
        const authToken = process.env.TWILIO_AUTH_TOKEN;
        const twilioNumber = process.env.TWILIO_PHONE_NUMBER;
        if (accountSid && authToken && twilioNumber) {
            const url = `https://api.twilio.com/2010-04-01/Accounts/${accountSid}/Messages.json`;
            const auth = Buffer.from(`${accountSid}:${authToken}`).toString('base64');
            const body = new URLSearchParams({
                To: mobile,
                From: twilioNumber,
                Body: `Your GroundLense verification code is: ${code}. Valid for 5 minutes.`,
            });
            try {
                const response = await fetch(url, {
                    method: 'POST',
                    headers: {
                        Authorization: `Basic ${auth}`,
                        'Content-Type': 'application/x-www-form-urlencoded',
                    },
                    body: body.toString(),
                });
                if (response.ok) {
                    const resData = (await response.json());
                    console.log(`[SMS] Twilio message sent successfully: ${resData.sid || 'N/A'}`);
                }
                else {
                    const errText = await response.text();
                    console.error(`[SMS] Twilio sending failed: ${response.statusText} - ${errText}`);
                }
            }
            catch (err) {
                console.error('[SMS] Error calling Twilio API:', err);
            }
        }
        else {
            console.log(`[SMS] Twilio credentials not configured. Mocking SMS sending: OTP ${code} to ${mobile}`);
        }
    }
    async sendOtp(dto) {
        const { type, target } = dto;
        const code = Math.floor(100000 + Math.random() * 900000).toString();
        const expiresAt = new Date(Date.now() + 5 * 60 * 1000);
        await this.db.otp.upsert({
            where: {
                type_target: { type, target },
            },
            update: {
                code,
                verified: false,
                expiresAt,
            },
            create: {
                type,
                target,
                code,
                verified: false,
                expiresAt,
            },
        });
        let isMock = true;
        if (type === 'EMAIL') {
            isMock = !(process.env.SMTP_HOST && process.env.SMTP_USER && process.env.SMTP_PASS);
            await this.sendEmailOtp(target, code);
        }
        else if (type === 'MOBILE') {
            isMock = !(process.env.TWILIO_ACCOUNT_SID && process.env.TWILIO_AUTH_TOKEN && process.env.TWILIO_PHONE_NUMBER);
            await this.sendSmsOtp(target, code);
        }
        return {
            success: true,
            message: `OTP sent successfully to ${target}`,
            isMock,
        };
    }
    async verifyOtp(dto) {
        const { type, target, code } = dto;
        let isMock = true;
        if (type === 'MOBILE') {
            isMock = !(process.env.TWILIO_ACCOUNT_SID && process.env.TWILIO_AUTH_TOKEN && process.env.TWILIO_PHONE_NUMBER);
        }
        else if (type === 'EMAIL') {
            isMock = !(process.env.SMTP_HOST && process.env.SMTP_USER && process.env.SMTP_PASS);
        }
        if (code === '123456' && isMock) {
            if (type === 'MOBILE') {
                await this.db.user.updateMany({
                    where: { mobile: target },
                    data: { mobileVerified: true },
                });
            }
            return {
                success: true,
                message: 'OTP verified successfully (mock bypass)',
            };
        }
        const record = await this.db.otp.findUnique({
            where: {
                type_target: { type, target },
            },
        });
        if (!record || record.code !== code || record.expiresAt < new Date()) {
            throw new common_1.BadRequestException('Invalid or expired OTP');
        }
        await this.db.otp.update({
            where: {
                type_target: { type, target },
            },
            data: {
                verified: true,
                expiresAt: new Date(Date.now() + 15 * 60 * 1000),
            },
        });
        if (type === 'MOBILE') {
            await this.db.user.updateMany({
                where: { mobile: target },
                data: { mobileVerified: true },
            });
        }
        return {
            success: true,
            message: 'OTP verified successfully',
        };
    }
    async verifyGst(gstin) {
        const gstRegex = /^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]{1}Z[0-9A-Z]{1}$/i;
        if (!gstRegex.test(gstin)) {
            throw new common_1.BadRequestException('Invalid GSTIN format');
        }
        const validateGstinChecksum = (valGstin) => {
            const chars = '0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZ';
            let sum = 0;
            for (let i = 0; i < 14; i++) {
                const val = chars.indexOf(valGstin[i].toUpperCase());
                if (val === -1)
                    return false;
                const factor = i % 2 === 0 ? 1 : 2;
                let temp = val * factor;
                temp = Math.floor(temp / 36) + (temp % 36);
                sum += temp;
            }
            const remainder = sum % 36;
            const checkCodePoint = (36 - remainder) % 36;
            const checkChar = chars[checkCodePoint];
            return valGstin[14].toUpperCase() === checkChar;
        };
        if (!validateGstinChecksum(gstin)) {
            throw new common_1.BadRequestException('GSTIN checksum validation failed');
        }
        const existingOrg = await this.db.organization.findFirst({
            where: { gstin },
        });
        if (existingOrg) {
            return {
                success: true,
                exists: true,
                organizationId: existingOrg.id,
                legalName: existingOrg.name,
                state: existingOrg.state,
                city: existingOrg.city,
                type: existingOrg.type,
            };
        }
        const STATE_CODES = {
            '01': 'Jammu & Kashmir',
            '02': 'Himachal Pradesh',
            '03': 'Punjab',
            '04': 'Chandigarh',
            '05': 'Uttarakhand',
            '06': 'Haryana',
            '07': 'Delhi',
            '08': 'Rajasthan',
            '09': 'Uttar Pradesh',
            '10': 'Bihar',
            '11': 'Sikkim',
            '12': 'Arunachal Pradesh',
            '13': 'Nagaland',
            '14': 'Manipur',
            '15': 'Mizoram',
            '16': 'Tripura',
            '17': 'Meghalaya',
            '18': 'Assam',
            '19': 'West Bengal',
            '20': 'Jharkhand',
            '21': 'Odisha',
            '22': 'Chhattisgarh',
            '23': 'Madhya Pradesh',
            '24': 'Gujarat',
            '25': 'Daman & Diu',
            '26': 'Dadra & Nagar Haveli',
            '27': 'Maharashtra',
            '28': 'Andhra Pradesh',
            '29': 'Karnataka',
            '30': 'Goa',
            '31': 'Lakshadweep',
            '32': 'Kerala',
            '33': 'Tamil Nadu',
            '34': 'Puducherry',
            '35': 'Andaman & Nicobar Islands',
            '36': 'Telangana',
            '37': 'Andhra Pradesh (New)',
            '38': 'Ladakh',
        };
        const stateCode = gstin.substring(0, 2);
        const state = STATE_CODES[stateCode] || 'Unknown';
        const pan = gstin.substring(2, 12);
        const apiKey = process.env.GSTIN_API_KEY;
        if (apiKey) {
            try {
                const response = await fetch(`https://api.appyflow.in/v1/gst/${gstin}`, {
                    headers: {
                        key_secret: apiKey,
                    },
                });
                if (response.ok) {
                    const data = (await response.json());
                    if (data && data.taxpayerInfo) {
                        const info = data.taxpayerInfo;
                        return {
                            success: true,
                            exists: false,
                            legalName: info.lgnm || info.tradeNam || 'Real-time Verified Business',
                            state: info.pradr?.addr?.stcd || state,
                            city: info.pradr?.addr?.dst || 'Parsed City',
                            pan: pan,
                        };
                    }
                }
            }
            catch (e) {
                console.error('Real-time GST API fetch failed:', e);
            }
        }
        return {
            success: true,
            exists: false,
            legalName: `Business under PAN ${pan}`,
            state: state,
            city: 'Parsed City',
            pan: pan,
        };
    }
    async getInviteDetails(token) {
        const user = await this.db.user.findFirst({
            where: {
                inviteToken: token,
                inviteExpiresAt: {
                    gt: new Date(),
                },
            },
            include: {
                organization: true,
                roles: {
                    include: {
                        role: true,
                    },
                },
            },
        });
        if (!user) {
            throw new common_1.NotFoundException('Invalid or expired invitation token');
        }
        return {
            email: user.email,
            organizationName: user.organization.name,
            roleCode: user.roles[0]?.role.code || 'MEMBER',
            roleName: user.roles[0]?.role.name || 'Member',
        };
    }
    async acceptInvite(dto) {
        const user = await this.db.user.findFirst({
            where: {
                inviteToken: dto.token,
                inviteExpiresAt: {
                    gt: new Date(),
                },
            },
        });
        if (!user) {
            throw new common_1.NotFoundException('Invalid or expired invitation token');
        }
        const passwordHash = await bcrypt.hash(dto.password, 10);
        const updatedUser = await this.db.user.update({
            where: { id: user.id },
            data: {
                firstName: dto.firstName,
                lastName: dto.lastName,
                passwordHash,
                status: 'ACTIVE',
                inviteToken: null,
                inviteExpiresAt: null,
            },
        });
        await this.activityLogsService.log(updatedUser.id, 'INVITE_ACCEPTED', 'USER', updatedUser.id);
        return this.issueTokens(updatedUser.id, updatedUser.organizationId);
    }
    async createJoinRequest(dto) {
        const existingUser = await this.db.user.findUnique({
            where: { email: dto.email },
        });
        if (existingUser) {
            throw new common_1.ConflictException('User with this email already exists');
        }
        const emailOtp = await this.db.otp.findUnique({
            where: { type_target: { type: 'EMAIL', target: dto.email } },
        });
        if (!emailOtp || !emailOtp.verified || emailOtp.expiresAt < new Date()) {
            throw new common_1.BadRequestException('Email OTP verification required');
        }
        const org = await this.db.organization.findFirst({
            where: { gstin: dto.gstin },
        });
        if (!org) {
            throw new common_1.NotFoundException('Organization with this GSTIN not found');
        }
        const passwordHash = await bcrypt.hash(dto.password, 10);
        let prefix = 'GL-USER';
        if (org.type === 'EPC_CONTRACTOR') {
            prefix = 'GL-CON';
        }
        else if (org.type === 'GEOTECH_CONTRACTOR') {
            prefix = 'GL-GEO';
        }
        let employeeCode = '';
        let isUnique = false;
        let attempts = 0;
        while (!isUnique && attempts < 10) {
            const randNum = Math.floor(1000 + Math.random() * 9000);
            employeeCode = `${prefix}-${randNum}`;
            const existing = await this.db.user.findUnique({
                where: { employeeCode },
            });
            if (!existing) {
                isUnique = true;
            }
            attempts++;
        }
        const user = await this.db.$transaction(async (tx) => {
            const newUser = await tx.user.create({
                data: {
                    organizationId: org.id,
                    employeeCode: isUnique ? employeeCode : null,
                    firstName: dto.firstName,
                    lastName: dto.lastName,
                    email: dto.email,
                    mobile: dto.mobile,
                    passwordHash,
                    status: 'INACTIVE',
                },
            });
            await tx.joinRequest.create({
                data: {
                    userId: newUser.id,
                    organizationId: org.id,
                    roleCode: dto.roleCode,
                    status: 'PENDING',
                },
            });
            const role = await tx.role.findUnique({
                where: { code: dto.roleCode },
            });
            if (role) {
                await tx.userRole.create({
                    data: {
                        userId: newUser.id,
                        roleId: role.id,
                    },
                });
            }
            return newUser;
        });
        try {
            await this.notificationsService.create({
                organizationId: org.id,
                title: 'New Join Request',
                message: `${user.firstName} ${user.lastName || ''}`.trim() + ` has requested to join your organization.`,
                type: 'JOIN_REQUEST',
            });
        }
        catch (err) {
            console.error('Failed to create join request notification:', err);
        }
        await this.activityLogsService.log(user.id, 'JOIN_REQUEST_CREATED', 'ORGANIZATION', org.id, {
            userId: user.id,
            orgId: org.id,
        });
        return {
            success: true,
            message: 'Join request submitted successfully. Awaiting admin approval.',
            employeeCode: user.employeeCode,
        };
    }
    async forgotPassword(email) {
        const user = await this.db.user.findUnique({
            where: { email },
        });
        if (!user) {
            throw new common_1.NotFoundException('No account found with this email');
        }
        const code = Math.floor(100000 + Math.random() * 900000).toString();
        const expiresAt = new Date(Date.now() + 10 * 60 * 1000);
        await this.db.otp.upsert({
            where: {
                type_target: { type: 'EMAIL', target: email },
            },
            update: {
                code,
                verified: false,
                expiresAt,
            },
            create: {
                type: 'EMAIL',
                target: email,
                code,
                verified: false,
                expiresAt,
            },
        });
        await this.sendEmailOtp(email, code);
        return {
            success: true,
            message: 'Password reset OTP sent successfully to your email.',
        };
    }
    async resetPassword(email, code, newPassword) {
        const record = await this.db.otp.findUnique({
            where: {
                type_target: { type: 'EMAIL', target: email },
            },
        });
        if (!record || record.code !== code || record.expiresAt < new Date()) {
            throw new common_1.BadRequestException('Invalid or expired verification OTP');
        }
        const user = await this.db.user.findUnique({
            where: { email },
        });
        if (!user) {
            throw new common_1.NotFoundException('User account not found');
        }
        const passwordHash = await bcrypt.hash(newPassword, 10);
        await this.db.$transaction([
            this.db.user.update({
                where: { id: user.id },
                data: { passwordHash },
            }),
            this.db.otp.delete({
                where: { type_target: { type: 'EMAIL', target: email } },
            }),
        ]);
        return {
            success: true,
            message: 'Password reset successfully.',
        };
    }
};
exports.AuthService = AuthService;
exports.AuthService = AuthService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [users_service_1.UsersService,
        jwt_1.JwtService,
        database_service_1.DatabaseService,
        activity_logs_service_1.ActivityLogsService,
        notifications_service_1.NotificationsService])
], AuthService);
//# sourceMappingURL=auth.service.js.map