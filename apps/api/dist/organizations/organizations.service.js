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
exports.OrganizationsService = void 0;
const common_1 = require("@nestjs/common");
const database_service_1 = require("../database/database.service");
const project_access_service_1 = require("../common/access/project-access.service");
const activity_logs_service_1 = require("../activity-logs/activity-logs.service");
const crypto = __importStar(require("crypto"));
const bcrypt = __importStar(require("bcrypt"));
const nodemailer = __importStar(require("nodemailer"));
const DIRECTORY_SELECT = {
    id: true,
    name: true,
    type: true,
    city: true,
    state: true,
};
let OrganizationsService = class OrganizationsService {
    db;
    access;
    activityLogsService;
    constructor(db, access, activityLogsService) {
        this.db = db;
        this.access = access;
        this.activityLogsService = activityLogsService;
    }
    async findAll(type) {
        return this.db.organization.findMany({
            where: type ? { type } : undefined,
            select: DIRECTORY_SELECT,
            orderBy: {
                name: 'asc',
            },
        });
    }
    async findOne(organizationId, user) {
        const organization = await this.db.organization.findUnique({
            where: { id: organizationId },
        });
        if (!organization) {
            throw new common_1.NotFoundException('Organization not found');
        }
        this.access.assertSameOrganization(user, organization.id);
        return organization;
    }
    async create(dto, user) {
        if (!this.access.isSuperAdmin(user)) {
            throw new common_1.ForbiddenException('Only the platform administrator can create organizations directly');
        }
        const organization = await this.db.organization.create({
            data: {
                name: dto.name,
                type: dto.type,
                email: dto.email,
                phone: dto.phone,
                address: dto.address,
                city: dto.city,
                state: dto.state,
                country: dto.country,
                gstin: dto.gstin,
                pan: dto.pan,
                registeredAddress: dto.registeredAddress,
                pincode: dto.pincode,
                logoUrl: dto.logoUrl,
                website: dto.website,
            },
        });
        await this.activityLogsService.log(user.id, 'ORGANIZATION_CREATED', 'ORGANIZATION', organization.id, {
            name: organization.name,
            type: organization.type,
        });
        return organization;
    }
    async update(organizationId, dto, user) {
        const organization = await this.db.organization.findUnique({
            where: { id: organizationId },
            select: { id: true },
        });
        if (!organization) {
            throw new common_1.NotFoundException('Organization not found');
        }
        this.access.assertSameOrganization(user, organizationId);
        const updated = await this.db.organization.update({
            where: { id: organizationId },
            data: {
                name: dto.name,
                email: dto.email,
                phone: dto.phone,
                address: dto.address,
                city: dto.city,
                state: dto.state,
                country: dto.country,
                gstin: dto.gstin,
                pan: dto.pan,
                registeredAddress: dto.registeredAddress,
                pincode: dto.pincode,
                logoUrl: dto.logoUrl,
                website: dto.website,
            },
        });
        await this.activityLogsService.log(user.id, 'ORGANIZATION_UPDATED', 'ORGANIZATION', organizationId, {
            updatedFields: Object.keys(dto),
        });
        return updated;
    }
    async verifyKyc(organizationId, user) {
        const organization = await this.db.organization.findUnique({
            where: { id: organizationId },
            select: { id: true, name: true },
        });
        if (!organization) {
            throw new common_1.NotFoundException('Organization not found');
        }
        const updated = await this.db.organization.update({
            where: { id: organizationId },
            data: {
                isVerified: true,
                verifiedAt: new Date(),
            },
        });
        await this.activityLogsService.log(user.id, 'ORGANIZATION_KYC_VERIFIED', 'ORGANIZATION', organizationId, {
            name: organization.name,
        });
        return updated;
    }
    async inviteMembers(dto, user) {
        const results = [];
        const organizationId = user.organizationId;
        const org = await this.db.organization.findUnique({
            where: { id: organizationId },
        });
        if (!org) {
            throw new common_1.NotFoundException('Organization not found');
        }
        for (const member of dto.members) {
            const { emailOrCode, roleCode } = member;
            const isEmail = emailOrCode.includes('@');
            if (isEmail) {
                const existingUser = await this.db.user.findUnique({
                    where: { email: emailOrCode },
                });
                if (existingUser) {
                    if (existingUser.organizationId !== organizationId) {
                        await this.db.user.update({
                            where: { id: existingUser.id },
                            data: { organizationId },
                        });
                    }
                    const role = await this.db.role.findUnique({
                        where: { code: roleCode },
                    });
                    if (role) {
                        const userRole = await this.db.userRole.findFirst({
                            where: { userId: existingUser.id, roleId: role.id },
                        });
                        if (!userRole) {
                            await this.db.userRole.create({
                                data: { userId: existingUser.id, roleId: role.id },
                            });
                        }
                    }
                    await this.activityLogsService.log(user.id, 'MEMBER_ADDED', 'USER', existingUser.id, {
                        email: emailOrCode,
                        role: roleCode,
                        organizationName: org.name,
                    });
                    void this.sendAddedToOrgEmail(emailOrCode, org.name);
                    results.push({
                        emailOrCode,
                        employeeCode: existingUser.employeeCode,
                        status: 'EXISTING',
                        message: 'User already in database',
                    });
                }
                else {
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
                    const token = crypto.randomBytes(16).toString('hex');
                    const passwordHash = await bcrypt.hash(crypto.randomBytes(8).toString('hex'), 10);
                    const newUser = await this.db.user.create({
                        data: {
                            organizationId,
                            employeeCode: isUnique ? employeeCode : null,
                            firstName: 'Invited',
                            lastName: 'Member',
                            email: emailOrCode,
                            passwordHash,
                            status: 'INACTIVE',
                            inviteToken: token,
                            inviteExpiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
                        },
                    });
                    const role = await this.db.role.findUnique({
                        where: { code: roleCode },
                    });
                    if (role) {
                        await this.db.userRole.create({
                            data: {
                                userId: newUser.id,
                                roleId: role.id,
                            },
                        });
                    }
                    const inviteLink = `http://localhost:3000/register/invite?token=${token}`;
                    console.log(`[INVITE] Member invite link for ${emailOrCode}: ${inviteLink}`);
                    await this.activityLogsService.log(user.id, 'MEMBER_INVITED', 'USER', newUser.id, {
                        email: emailOrCode,
                        role: roleCode,
                        organizationName: org.name,
                    });
                    void this.sendInviteEmail(emailOrCode, inviteLink, org.name);
                    results.push({
                        emailOrCode,
                        employeeCode: newUser.employeeCode,
                        status: 'INVITED',
                        inviteLink,
                    });
                }
            }
            else {
                const existingUser = await this.db.user.findUnique({
                    where: { employeeCode: emailOrCode },
                });
                if (existingUser) {
                    if (existingUser.organizationId !== organizationId) {
                        await this.db.user.update({
                            where: { id: existingUser.id },
                            data: { organizationId },
                        });
                    }
                    const role = await this.db.role.findUnique({
                        where: { code: roleCode },
                    });
                    if (role) {
                        const userRole = await this.db.userRole.findFirst({
                            where: { userId: existingUser.id, roleId: role.id },
                        });
                        if (!userRole) {
                            await this.db.userRole.create({
                                data: { userId: existingUser.id, roleId: role.id },
                            });
                        }
                    }
                    await this.activityLogsService.log(user.id, 'MEMBER_ADDED', 'USER', existingUser.id, {
                        email: existingUser.email,
                        role: roleCode,
                        organizationName: org.name,
                    });
                    if (existingUser.email) {
                        void this.sendAddedToOrgEmail(existingUser.email, org.name);
                    }
                    results.push({
                        emailOrCode,
                        employeeCode: existingUser.employeeCode,
                        status: 'EXISTING',
                        message: 'User already in database',
                    });
                }
                else {
                    results.push({
                        emailOrCode,
                        status: 'NOT_FOUND',
                        error: 'Employee code not found',
                    });
                }
            }
        }
        return results;
    }
    async getTransporter() {
        const host = process.env.SMTP_HOST;
        const port = process.env.SMTP_PORT
            ? parseInt(process.env.SMTP_PORT, 10)
            : 587;
        const user = process.env.SMTP_USER;
        const pass = process.env.SMTP_PASS;
        if (host && user && pass) {
            return nodemailer.createTransport({
                host,
                port,
                secure: port === 465,
                auth: {
                    user,
                    pass,
                },
            });
        }
        else {
            console.log('[Email] SMTP credentials not configured. Creating Ethereal test account...');
            try {
                const testAccount = await nodemailer.createTestAccount();
                return nodemailer.createTransport({
                    host: 'smtp.ethereal.email',
                    port: 587,
                    secure: false,
                    auth: {
                        user: testAccount.user,
                        pass: testAccount.pass,
                    },
                });
            }
            catch (err) {
                console.error('Failed to create Ethereal test account:', err);
                return null;
            }
        }
    }
    async sendInviteEmail(email, inviteLink, orgName) {
        const transporter = await this.getTransporter();
        if (!transporter)
            return;
        const from = process.env.SMTP_FROM || `"GroundLense" <no-reply@groundlense.com>`;
        const mailOptions = {
            from,
            to: email,
            subject: `Invitation to join ${orgName} on GroundLense`,
            text: `You have been invited to join ${orgName} on GroundLense. Click the following link to set up your account: ${inviteLink}`,
            html: `
        <div style="font-family: sans-serif; padding: 20px; color: #333;">
          <h2 style="color: #4f46e5;">Welcome to GroundLense!</h2>
          <p>You have been invited to join <strong>${orgName}</strong> on GroundLense.</p>
          <p>Please click the button below to set up your account, choose a password, and join the organization:</p>
          <div style="margin: 30px 0;">
            <a href="${inviteLink}" style="background-color: #4f46e5; color: white; padding: 12px 24px; text-decoration: none; font-weight: bold; border-radius: 6px; display: inline-block;">
              Set Up Your Account
            </a>
          </div>
          <p style="font-size: 14px; color: #6b7280;">If the button doesn't work, copy and paste this URL into your browser:</p>
          <p style="font-size: 14px; color: #4f46e5; word-break: break-all;">${inviteLink}</p>
        </div>
      `,
        };
        try {
            const info = await transporter.sendMail(mailOptions);
            console.log(`[Email] Invitation sent to ${email}. Message ID: ${info.messageId}`);
            const previewUrl = nodemailer.getTestMessageUrl(info);
            if (previewUrl) {
                console.log(`[Email] Invitation Preview URL (Ethereal): ${previewUrl}`);
            }
        }
        catch (err) {
            console.error(`Failed to send invitation email to ${email}:`, err);
        }
    }
    async sendAddedToOrgEmail(email, orgName) {
        const transporter = await this.getTransporter();
        if (!transporter)
            return;
        const from = process.env.SMTP_FROM || `"GroundLense" <no-reply@groundlense.com>`;
        const mailOptions = {
            from,
            to: email,
            subject: `You have been added to ${orgName} on GroundLense`,
            text: `You have been added to the organization ${orgName} on GroundLense. You can now log in to access your organization dashboard.`,
            html: `
        <div style="font-family: sans-serif; padding: 20px; color: #333;">
          <h2 style="color: #4f46e5;">Organization Update</h2>
          <p>Hello,</p>
          <p>You have been added to the organization <strong>${orgName}</strong> on GroundLense.</p>
          <p>You can now log in using your existing credentials to access your new organization's dashboard.</p>
          <div style="margin: 30px 0;">
            <a href="http://localhost:3000/login" style="background-color: #4f46e5; color: white; padding: 12px 24px; text-decoration: none; font-weight: bold; border-radius: 6px; display: inline-block;">
              Log In Now
            </a>
          </div>
        </div>
      `,
        };
        try {
            const info = await transporter.sendMail(mailOptions);
            console.log(`[Email] Added-to-org notification sent to ${email}. Message ID: ${info.messageId}`);
            const previewUrl = nodemailer.getTestMessageUrl(info);
            if (previewUrl) {
                console.log(`[Email] Added-to-org Preview URL (Ethereal): ${previewUrl}`);
            }
        }
        catch (err) {
            console.error(`Failed to send added-to-org email to ${email}:`, err);
        }
    }
    async getJoinRequests(user) {
        const organizationId = user.organizationId;
        return this.db.joinRequest.findMany({
            where: {
                organizationId,
                status: 'PENDING',
            },
            include: {
                user: {
                    select: {
                        id: true,
                        firstName: true,
                        lastName: true,
                        email: true,
                        mobile: true,
                        employeeCode: true,
                    },
                },
            },
            orderBy: {
                createdAt: 'desc',
            },
        });
    }
    async approveJoinRequest(requestId, user) {
        const organizationId = user.organizationId;
        const req = await this.db.joinRequest.findUnique({
            where: { id: requestId },
        });
        if (!req || req.organizationId !== organizationId) {
            throw new common_1.NotFoundException('Join request not found');
        }
        await this.db.$transaction([
            this.db.joinRequest.update({
                where: { id: requestId },
                data: { status: 'APPROVED' },
            }),
            this.db.user.update({
                where: { id: req.userId },
                data: { status: 'ACTIVE' },
            }),
        ]);
        await this.activityLogsService.log(user.id, 'JOIN_REQUEST_APPROVED', 'USER', req.userId, { requestId });
        return { success: true, message: 'User approved successfully.' };
    }
    async rejectJoinRequest(requestId, user) {
        const organizationId = user.organizationId;
        const req = await this.db.joinRequest.findUnique({
            where: { id: requestId },
        });
        if (!req || req.organizationId !== organizationId) {
            throw new common_1.NotFoundException('Join request not found');
        }
        await this.db.$transaction([
            this.db.joinRequest.update({
                where: { id: requestId },
                data: { status: 'REJECTED' },
            }),
            this.db.user.update({
                where: { id: req.userId },
                data: { status: 'INACTIVE' },
            }),
        ]);
        await this.activityLogsService.log(user.id, 'JOIN_REQUEST_REJECTED', 'USER', req.userId, { requestId });
        return { success: true, message: 'User request rejected.' };
    }
};
exports.OrganizationsService = OrganizationsService;
exports.OrganizationsService = OrganizationsService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [database_service_1.DatabaseService,
        project_access_service_1.ProjectAccessService,
        activity_logs_service_1.ActivityLogsService])
], OrganizationsService);
//# sourceMappingURL=organizations.service.js.map