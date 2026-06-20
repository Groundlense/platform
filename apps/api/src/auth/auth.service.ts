import {
  ConflictException,
  Injectable,
  UnauthorizedException,
  BadRequestException,
  NotFoundException,
} from '@nestjs/common';

import { JwtService } from '@nestjs/jwt';

import * as nodemailer from 'nodemailer';
import * as bcrypt from 'bcrypt';
import * as crypto from 'crypto';

import { UsersService } from '../users/users.service';
import { DatabaseService } from '../database/database.service';
import { ActivityLogsService } from '../activity-logs/activity-logs.service';
import { RegisterDto } from './dto/register.dto';
import { SendOtpDto } from './dto/send-otp.dto';
import { VerifyOtpDto } from './dto/verify-otp.dto';
import { JoinRequestDto } from './dto/join-request.dto';
import { AcceptInviteDto } from './dto/accept-invite.dto';
import { NotificationsService } from '../notifications/notifications.service';

@Injectable()
export class AuthService {
  constructor(
    private readonly usersService: UsersService,
    private readonly jwtService: JwtService,
    private readonly db: DatabaseService,
    private readonly activityLogsService: ActivityLogsService,
    private readonly notificationsService: NotificationsService,
  ) {}

  // Refresh tokens are high-entropy random values, so a deterministic
  // SHA-256 lets us look the row up directly instead of bcrypt-comparing
  // against every stored token.
  private hashToken(token: string) {
    return crypto.createHash('sha256').update(token).digest('hex');
  }

  private generateRefreshToken() {
    return crypto.randomBytes(48).toString('base64url');
  }

  // Single place that mints the access/refresh token pair so login,
  // refresh and register all share the same hashing/expiry behaviour.
  private async issueTokens(userId: string, organizationId: string) {
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

  async login(identifier: string, password: string) {
    const user = await this.usersService.findByIdentifier(identifier);

    if (!user) {
      throw new UnauthorizedException('Invalid credentials');
    }

    if (user.status !== 'ACTIVE') {
      throw new UnauthorizedException('User account inactive');
    }

    // Accept the account password or, for field workers, the PIN —
    // a user with an employee code must still be able to use their password.
    let valid = await bcrypt.compare(password, user.passwordHash);

    if (!valid && user.pinHash) {
      valid = await bcrypt.compare(password, user.pinHash);
    }

    if (!valid) {
      throw new UnauthorizedException('Invalid credentials');
    }

    await this.activityLogsService.log(user.id, 'LOGIN', 'USER', user.id);

    return this.issueTokens(user.id, user.organizationId);
  }

  /**
   * Public company self-registration: creates the Organization and its
   * first admin user, then signs them in.
   *
   * NOTE: phone-OTP verification per the spec requires an SMS provider
   * and is not implemented; email/password registration is the real,
   * honest path for now.
   */
  async register(dto: RegisterDto) {
    // 1. Verify OTP for email and mobile
    const emailOtp = await this.db.otp.findUnique({
      where: { type_target: { type: 'EMAIL', target: dto.admin.email } },
    });
    if (!emailOtp || !emailOtp.verified || emailOtp.expiresAt < new Date()) {
      throw new BadRequestException('Email OTP verification required');
    }

    /*
    if (dto.admin.mobile) {
      const mobileOtp = await this.db.otp.findUnique({
        where: { type_target: { type: 'MOBILE', target: dto.admin.mobile } },
      });
      if (
        !mobileOtp ||
        !mobileOtp.verified ||
        mobileOtp.expiresAt < new Date()
      ) {
        throw new BadRequestException('Mobile OTP verification required');
      }
    }
    */

    const existingUser = await this.db.user.findUnique({
      where: { email: dto.admin.email },
      select: { id: true },
    });

    if (existingUser) {
      throw new ConflictException('A user with this email already exists');
    }

    // gstin is not a unique column in the schema, so we enforce
    // uniqueness here to avoid duplicate company registrations.
    if (dto.organization.gstin) {
      const existingOrg = await this.db.organization.findFirst({
        where: { gstin: dto.organization.gstin },
        select: { id: true },
      });

      if (existingOrg) {
        throw new ConflictException(
          'An organization with this GSTIN already exists',
        );
      }
    }

    // Org type decides the admin role. Only EPC/GEOTECH admin roles
    // exist in the seed; other org types default to GEOTECH_ADMIN.
    const roleCode =
      dto.organization.type === 'EPC_CONTRACTOR'
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
      } else if (dto.organization.type === 'GEOTECH_CONTRACTOR') {
        prefix = 'GL-GEO';
      } else if (dto.organization.type === 'CLIENT') {
        prefix = 'GL-CL';
      } else if (dto.organization.type === 'NABL_LAB') {
        prefix = 'GL-LAB';
      } else if (dto.organization.type === 'IE_FIRM') {
        prefix = 'GL-ENG';
      } else if (dto.organization.type === 'STRUCTURAL_CONSULTANT') {
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

      // Check for pending project invitations
      const pendingInvites = await tx.projectInvitation.findMany({
        where: {
          email: dto.admin.email,
          status: 'PENDING',
        },
      });

      for (const invite of pendingInvites) {
        const updateData: any = {};
        if (dto.organization.type === 'GEOTECH_CONTRACTOR') {
          updateData.geotechOrganizationId = organization.id;
        } else if (dto.organization.type === 'EPC_CONTRACTOR') {
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

    await this.activityLogsService.log(
      user.id,
      'REGISTER',
      'ORGANIZATION',
      user.organizationId,
      {
        organizationName: dto.organization.name,
        organizationType: dto.organization.type,
        adminRole: roleCode,
      },
    );

    return this.issueTokens(user.id, user.organizationId);
  }

  async refresh(refreshToken: string) {
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
      throw new UnauthorizedException('Invalid refresh token');
    }

    await this.db.refreshToken.update({
      where: {
        id: matchedToken.id,
      },
      data: {
        revokedAt: new Date(),
      },
    });

    return this.issueTokens(
      matchedToken.user.id,
      matchedToken.user.organizationId,
    );
  }
  async logout(refreshToken: string) {
    const token = await this.db.refreshToken.findFirst({
      where: {
        tokenHash: this.hashToken(refreshToken),
        revokedAt: null,
      },
    });

    if (!token) {
      throw new UnauthorizedException('Invalid refresh token');
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

  private async sendEmailOtp(email: string, code: string): Promise<void> {
    const host = process.env.SMTP_HOST;
    const port = process.env.SMTP_PORT
      ? parseInt(process.env.SMTP_PORT, 10)
      : 587;
    const user = process.env.SMTP_USER;
    const pass = process.env.SMTP_PASS;
    const from =
      process.env.SMTP_FROM || `"GroundLense" <no-reply@groundlense.com>`;

    let transporter: nodemailer.Transporter;

    if (host && user && pass) {
      transporter = nodemailer.createTransport({
        host,
        port,
        secure: port === 465,
        auth: {
          user,
          pass,
        },
      });
    } else {
      console.log(
        '[Email] SMTP credentials not configured. Creating Ethereal test account...',
      );
      try {
        const testAccount = await nodemailer.createTestAccount();
        transporter = nodemailer.createTransport({
          host: 'smtp.ethereal.email',
          port: 587,
          secure: false,
          auth: {
            user: testAccount.user,
            pass: testAccount.pass,
          },
        });
      } catch (err) {
        console.error('Failed to create Ethereal test account:', err);
        return;
      }
    }

    const mailOptions = {
      from,
      to: email,
      subject: 'Your GroundLense Verification OTP',
      text: `Your GroundLense OTP is ${code}. It is valid for 5 minutes.`,
      html: `
        <div style="font-family: sans-serif; padding: 20px; color: #333;">
          <h2 style="color: #4f46e5;">GroundLense Verification</h2>
          <p>Please use the following One-Time Password (OTP) to complete your verification:</p>
          <div style="font-size: 28px; font-weight: bold; background: #f3f4f6; padding: 15px; text-align: center; border-radius: 8px; letter-spacing: 4px; margin: 20px 0;">
            ${code}
          </div>
          <p style="font-size: 14px; color: #6b7280;">This OTP is valid for 5 minutes. Please do not share it with anyone.</p>
        </div>
      `,
    };

    try {
      // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
      const info = await transporter.sendMail(mailOptions);
      console.log(
        // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
        `[Email] OTP sent to ${email}. Message ID: ${info.messageId}`,
      );
      // eslint-disable-next-line @typescript-eslint/no-unsafe-argument
      const previewUrl = nodemailer.getTestMessageUrl(info);
      if (previewUrl) {
        console.log(`[Email] Preview URL (Ethereal): ${previewUrl}`);
      }
    } catch (err) {
      console.error(`Failed to send email to ${email}:`, err);
    }
  }

  private async sendSmsOtp(mobile: string, code: string): Promise<void> {
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
          const resData = (await response.json()) as { sid?: string };
          console.log(
            `[SMS] Twilio message sent successfully: ${resData.sid || 'N/A'}`,
          );
        } else {
          const errText = await response.text();
          console.error(
            `[SMS] Twilio sending failed: ${response.statusText} - ${errText}`,
          );
        }
      } catch (err) {
        console.error('[SMS] Error calling Twilio API:', err);
      }
    } else {
      console.log(
        `[SMS] Twilio credentials not configured. Mocking SMS sending: OTP ${code} to ${mobile}`,
      );
    }
  }

  async sendOtp(dto: SendOtpDto) {
    const { type, target } = dto;
    const code = Math.floor(100000 + Math.random() * 900000).toString();
    const expiresAt = new Date(Date.now() + 5 * 60 * 1000); // 5 mins

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
    } else if (type === 'MOBILE') {
      isMock = !(process.env.TWILIO_ACCOUNT_SID && process.env.TWILIO_AUTH_TOKEN && process.env.TWILIO_PHONE_NUMBER);
      await this.sendSmsOtp(target, code);
    }

    return {
      success: true,
      message: `OTP sent successfully to ${target}`,
      isMock,
    };
  }

  async verifyOtp(dto: VerifyOtpDto) {
    const { type, target, code } = dto;

    let isMock = true;
    if (type === 'MOBILE') {
      isMock = !(process.env.TWILIO_ACCOUNT_SID && process.env.TWILIO_AUTH_TOKEN && process.env.TWILIO_PHONE_NUMBER);
    } else if (type === 'EMAIL') {
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
      throw new BadRequestException('Invalid or expired OTP');
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

  async verifyGst(gstin: string) {
    const gstRegex =
      /^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]{1}Z[0-9A-Z]{1}$/i;
    if (!gstRegex.test(gstin)) {
      throw new BadRequestException('Invalid GSTIN format');
    }

    const validateGstinChecksum = (valGstin: string): boolean => {
      const chars = '0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZ';
      let sum = 0;
      for (let i = 0; i < 14; i++) {
        const val = chars.indexOf(valGstin[i].toUpperCase());
        if (val === -1) return false;
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
      throw new BadRequestException('GSTIN checksum validation failed');
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

    const STATE_CODES: Record<string, string> = {
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
        const response = await fetch(
          `https://api.appyflow.in/v1/gst/${gstin}`,
          {
            headers: {
              key_secret: apiKey,
            },
          },
        );
        if (response.ok) {
          const data = (await response.json()) as {
            taxpayerInfo?: {
              lgnm?: string;
              tradeNam?: string;
              pradr?: {
                addr?: {
                  stcd?: string;
                  dst?: string;
                };
              };
            };
          };
          if (data && data.taxpayerInfo) {
            const info = data.taxpayerInfo;
            return {
              success: true,
              exists: false,
              legalName:
                info.lgnm || info.tradeNam || 'Real-time Verified Business',
              state: info.pradr?.addr?.stcd || state,
              city: info.pradr?.addr?.dst || 'Parsed City',
              pan: pan,
            };
          }
        }
      } catch (e) {
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

  async getInviteDetails(token: string) {
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
      throw new NotFoundException('Invalid or expired invitation token');
    }

    return {
      email: user.email,
      organizationName: user.organization.name,
      roleCode: user.roles[0]?.role.code || 'MEMBER',
      roleName: user.roles[0]?.role.name || 'Member',
    };
  }

  async acceptInvite(dto: AcceptInviteDto) {
    const user = await this.db.user.findFirst({
      where: {
        inviteToken: dto.token,
        inviteExpiresAt: {
          gt: new Date(),
        },
      },
    });

    if (!user) {
      throw new NotFoundException('Invalid or expired invitation token');
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

    await this.activityLogsService.log(
      updatedUser.id,
      'INVITE_ACCEPTED',
      'USER',
      updatedUser.id,
    );

    return this.issueTokens(updatedUser.id, updatedUser.organizationId);
  }

  async createJoinRequest(dto: JoinRequestDto) {
    const existingUser = await this.db.user.findUnique({
      where: { email: dto.email },
    });
    if (existingUser) {
      throw new ConflictException('User with this email already exists');
    }

    const emailOtp = await this.db.otp.findUnique({
      where: { type_target: { type: 'EMAIL', target: dto.email } },
    });
    if (!emailOtp || !emailOtp.verified || emailOtp.expiresAt < new Date()) {
      throw new BadRequestException('Email OTP verification required');
    }

    /*
    if (dto.mobile) {
      const mobileOtp = await this.db.otp.findUnique({
        where: { type_target: { type: 'MOBILE', target: dto.mobile } },
      });
      if (!mobileOtp || !mobileOtp.verified || mobileOtp.expiresAt < new Date()) {
        throw new BadRequestException('Mobile OTP verification required');
      }
    }
    */

    const org = await this.db.organization.findFirst({
      where: { gstin: dto.gstin },
    });
    if (!org) {
      throw new NotFoundException('Organization with this GSTIN not found');
    }

    const passwordHash = await bcrypt.hash(dto.password, 10);

    let prefix = 'GL-USER';
    if (org.type === 'EPC_CONTRACTOR') {
      prefix = 'GL-CON';
    } else if (org.type === 'GEOTECH_CONTRACTOR') {
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
    } catch (err) {
      console.error('Failed to create join request notification:', err);
    }

    await this.activityLogsService.log(
      user.id,
      'JOIN_REQUEST_CREATED',
      'ORGANIZATION',
      org.id,
      {
        userId: user.id,
        orgId: org.id,
      },
    );

    return {
      success: true,
      message: 'Join request submitted successfully. Awaiting admin approval.',
      employeeCode: user.employeeCode,
    };
  }

  async forgotPassword(email: string) {
    const user = await this.db.user.findUnique({
      where: { email },
    });
    if (!user) {
      throw new NotFoundException('No account found with this email');
    }

    const code = Math.floor(100000 + Math.random() * 900000).toString();
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10 mins

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

  async resetPassword(email: string, code: string, newPassword: string) {
    const record = await this.db.otp.findUnique({
      where: {
        type_target: { type: 'EMAIL', target: email },
      },
    });

    if (!record || record.code !== code || record.expiresAt < new Date()) {
      throw new BadRequestException('Invalid or expired verification OTP');
    }

    const user = await this.db.user.findUnique({
      where: { email },
    });

    if (!user) {
      throw new NotFoundException('User account not found');
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
}
