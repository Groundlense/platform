import {
  ConflictException,
  Injectable,
  UnauthorizedException,
  BadRequestException,
  NotFoundException,
} from '@nestjs/common';

import { JwtService } from '@nestjs/jwt';

import { sendEmail } from '../common/email.helper';
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

    await sendEmail({
      to: email,
      subject,
      text,
      html,
    });
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

  async contactMessage(body: {
    name?: string;
    company?: string;
    email?: string;
    phone?: string;
    message?: string;
  }) {
    const name = body.name?.trim();
    const email = body.email?.trim();
    const message = body.message?.trim();
    if (!name || !email || !message) {
      throw new BadRequestException('Name, email and message are required');
    }

    const lines = [
      `Name: ${name}`,
      body.company?.trim() ? `Company: ${body.company.trim()}` : null,
      `Email: ${email}`,
      body.phone?.trim() ? `Phone: ${body.phone.trim()}` : null,
      '',
      message,
    ].filter((l): l is string => l !== null);

    const esc = (s: string) =>
      s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');

    await sendEmail({
      to: 'info@groundlense.com',
      subject: `Contact form — ${name}${body.company?.trim() ? ` (${body.company.trim()})` : ''}`,
      text: lines.join('\n'),
      html: `<p>${lines.map(esc).join('<br>')}</p><p>Reply to: <a href="mailto:${esc(email)}">${esc(email)}</a></p>`,
    });

    return { success: true };
  }

  // Public account-deletion request from the web form (Google Play requires a
  // deletion route reachable without signing in, so this endpoint is unauthenticated).
  async accountDeletionRequest(body: {
    name?: string;
    email?: string;
    phone?: string;
    employeeCode?: string;
    organization?: string;
    reason?: string;
  }) {
    const name = body.name?.trim();
    const email = body.email?.trim();
    const phone = body.phone?.trim();
    // Field workers sign in on mobile with a number or employee code and often
    // have no email on their account, so either identifier is enough.
    if (!name || (!email && !phone)) {
      throw new BadRequestException(
        'Name and either an account email or registered mobile number are required',
      );
    }

    const lines = [
      `Name: ${name}`,
      email ? `Account email: ${email}` : null,
      phone ? `Registered mobile: ${phone}` : null,
      body.employeeCode?.trim()
        ? `Employee code: ${body.employeeCode.trim()}`
        : null,
      body.organization?.trim()
        ? `Organization: ${body.organization.trim()}`
        : null,
      body.reason?.trim() ? `Reason: ${body.reason.trim()}` : null,
      '',
      'Action required: verify the requester owns this account, then delete the',
      'personal profile and unlink it from the organization within 30 days.',
      email
        ? 'Confirm completion by email.'
        : 'No email on the request — confirm completion on the mobile number above.',
    ].filter((l): l is string => l !== null);

    const esc = (s: string) =>
      s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');

    await sendEmail({
      to: 'info@groundlense.com',
      subject: `Account deletion request — ${email || phone}`,
      text: lines.join('\n'),
      html: `<p>${lines.map(esc).join('<br>')}</p>${
        email
          ? `<p>Reply to: <a href="mailto:${esc(email)}">${esc(email)}</a></p>`
          : ''
      }`,
    });

    // Nothing to acknowledge to when the requester gave only a mobile number —
    // support confirms on that number instead.
    if (!email) {
      return { success: true };
    }

    // Acknowledgement to the requester so they have a written record of the request.
    const ackLines = [
      `Hello ${name},`,
      '',
      'We have received your request to delete your GroundLense account and the',
      'personal data associated with it.',
      '',
      'What happens next:',
      '1. We verify that the request comes from the account owner.',
      '2. Your profile, login credentials, device location history and photo',
      '   attributions are deleted.',
      '3. Completion is confirmed by email within 30 days.',
      '',
      'Geotechnical borehole records that form part of a client project report are',
      'retained by the organization that commissioned them, as required for',
      'statutory audit — but they are no longer linked to your personal profile.',
      '',
      'If you did not make this request, reply to this email immediately.',
      '',
      'GroundLense Technologies Private Limited',
    ];

    await sendEmail({
      to: email,
      subject: 'GroundLense — account deletion request received',
      text: ackLines.join('\n'),
      html: `<p>${ackLines.map(esc).join('<br>')}</p>`,
    });

    return { success: true };
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

  /**
   * Sends a password-reset OTP to an email OR a mobile number (SMS).
   * Mobile is the field-worker path — their accounts often have no email.
   */
  async forgotPassword(input: { email?: string; mobile?: string }) {
    const { email, mobile } = input;
    if (!email && !mobile) {
      throw new BadRequestException('Provide an email or mobile number');
    }

    const user = mobile
      ? await this.db.user.findFirst({ where: { mobile } })
      : await this.db.user.findUnique({ where: { email } });
    if (!user) {
      throw new NotFoundException(
        mobile
          ? 'No account found with this mobile number'
          : 'No account found with this email',
      );
    }

    const type = mobile ? 'MOBILE' : 'EMAIL';
    const target = (mobile ?? email)!;
    const code = Math.floor(100000 + Math.random() * 900000).toString();
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10 mins

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
    if (mobile) {
      isMock = !(
        process.env.TWILIO_ACCOUNT_SID &&
        process.env.TWILIO_AUTH_TOKEN &&
        process.env.TWILIO_PHONE_NUMBER
      );
      await this.sendSmsOtp(mobile, code);
    } else {
      isMock = !(process.env.SMTP_HOST && process.env.SMTP_USER && process.env.SMTP_PASS);
      await this.sendEmailOtp(email!, code);
    }

    return {
      success: true,
      message: mobile
        ? 'Password reset OTP sent to your mobile number.'
        : 'Password reset OTP sent successfully to your email.',
      isMock,
    };
  }

  async resetPassword(input: {
    email?: string;
    mobile?: string;
    code: string;
    newPassword: string;
  }) {
    const { email, mobile, code, newPassword } = input;
    if (!email && !mobile) {
      throw new BadRequestException('Provide an email or mobile number');
    }

    const type = mobile ? 'MOBILE' : 'EMAIL';
    const target = (mobile ?? email)!;

    const record = await this.db.otp.findUnique({
      where: {
        type_target: { type, target },
      },
    });

    // Same mock bypass as verifyOtp: without an SMS provider configured the
    // real code only ever lands in the server log, so '123456' stands in.
    const smsMock =
      type === 'MOBILE' &&
      !(
        process.env.TWILIO_ACCOUNT_SID &&
        process.env.TWILIO_AUTH_TOKEN &&
        process.env.TWILIO_PHONE_NUMBER
      );
    const codeOk =
      (record && record.code === code && record.expiresAt >= new Date()) ||
      (smsMock && code === '123456');

    if (!codeOk) {
      throw new BadRequestException('Invalid or expired verification OTP');
    }

    const user = mobile
      ? await this.db.user.findFirst({ where: { mobile } })
      : await this.db.user.findUnique({ where: { email } });

    if (!user) {
      throw new NotFoundException('User account not found');
    }

    const passwordHash = await bcrypt.hash(newPassword, 10);

    await this.db.user.update({
      where: { id: user.id },
      data: { passwordHash },
    });
    if (record) {
      await this.db.otp.delete({
        where: { type_target: { type, target } },
      });
    }

    await this.activityLogsService.log(
      user.id,
      'PASSWORD_RESET',
      'USER',
      user.id,
    );

    return {
      success: true,
      message: 'Password reset successfully.',
    };
  }

  // ==========================================
  // WhatsApp PIN-reset link (no SMS gateway)
  // ==========================================
  //
  // There is no paid SMS/WhatsApp integration, so the reset link rides the
  // same channel as crew onboarding: an org admin opens WhatsApp (wa.me)
  // with a prefilled message containing a unique single-use link. The link
  // opens the web /reset-pin page, where the worker proves ownership by
  // entering the account's mobile number and sets a new PIN.
  //
  // Tokens live in the existing Otp table (type RESET_LINK, target mobile)
  // — single-use, 24h expiry, no schema change needed.

  private static readonly RESET_LINK_OTP_TYPE = 'RESET_LINK';

  private async mintPinResetToken(mobile: string): Promise<string> {
    const token = crypto.randomBytes(24).toString('base64url');
    const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000);
    await this.db.otp.upsert({
      where: {
        type_target: {
          type: AuthService.RESET_LINK_OTP_TYPE,
          target: mobile,
        },
      },
      update: { code: token, verified: false, expiresAt },
      create: {
        type: AuthService.RESET_LINK_OTP_TYPE,
        target: mobile,
        code: token,
        verified: false,
        expiresAt,
      },
    });
    return token;
  }

  private pinResetUrl(token: string): string {
    const webUrl = process.env.WEB_URL || 'http://localhost:3000';
    return `${webUrl}/reset-pin?token=${token}`;
  }

  /**
   * Worker-initiated (public, from the app's "Forgot PIN" screen): records
   * the request and notifies the org's web users, who send the reset link
   * to the worker on WhatsApp from the Crew tab.
   */
  async requestPinResetLink(mobile: string) {
    const trimmed = mobile.trim();
    const user = await this.db.user.findFirst({ where: { mobile: trimmed } });
    if (!user) {
      throw new NotFoundException('No account found with this mobile number');
    }

    await this.mintPinResetToken(trimmed);

    // Tell the org's web users (anyone with an email login) so one of them
    // can send the link. Field workers themselves have no email — excluded.
    const admins = await this.db.user.findMany({
      where: {
        organizationId: user.organizationId,
        id: { not: user.id },
        status: 'ACTIVE',
        email: { not: null },
      },
      select: { id: true },
      take: 20,
    });
    const workerName =
      `${user.firstName ?? ''} ${user.lastName ?? ''}`.trim() || trimmed;
    for (const admin of admins) {
      await this.notificationsService
        .create({
          userId: admin.id,
          title: 'PIN reset requested',
          message: `${workerName} (${trimmed}) forgot their PIN. Open the Crew tab and use "PIN reset" to send them a new-PIN link on WhatsApp.`,
          type: 'PIN_RESET_REQUEST',
        })
        .catch(() => undefined);
    }

    await this.activityLogsService.log(
      user.id,
      'PIN_RESET_REQUESTED',
      'USER',
      user.id,
    );

    return {
      success: true,
      message:
        'Reset request sent. Your supervisor will send you a reset link on WhatsApp.',
    };
  }

  /**
   * Admin-side (JWT): mints the unique link for a worker so the admin can
   * share it on WhatsApp (wa.me). Same-organization only.
   */
  async generatePinResetLink(targetUserId: string, actor: any) {
    const user = await this.db.user.findUnique({
      where: { id: targetUserId },
      select: {
        id: true,
        firstName: true,
        lastName: true,
        mobile: true,
        organizationId: true,
      },
    });
    if (!user) {
      throw new NotFoundException('User not found');
    }
    if (user.organizationId !== actor.organizationId) {
      throw new UnauthorizedException(
        'You can only reset PINs for your own organization',
      );
    }
    if (!user.mobile) {
      throw new BadRequestException(
        'This user has no mobile number on record',
      );
    }

    const token = await this.mintPinResetToken(user.mobile);

    await this.activityLogsService.log(
      actor.id,
      'PIN_RESET_LINK_GENERATED',
      'USER',
      user.id,
    );

    return {
      success: true,
      url: this.pinResetUrl(token),
      mobile: user.mobile,
      firstName: user.firstName,
      expiresInHours: 24,
    };
  }

  /**
   * Public (from the /reset-pin web page): the worker proves ownership by
   * pairing the link token with the account's mobile number, then sets the
   * new PIN. Token is single-use.
   */
  async completePinResetLink(input: {
    token: string;
    mobile: string;
    newPassword: string;
  }) {
    const mobile = input.mobile.trim();
    const record = await this.db.otp.findUnique({
      where: {
        type_target: {
          type: AuthService.RESET_LINK_OTP_TYPE,
          target: mobile,
        },
      },
    });

    if (
      !record ||
      record.code !== input.token ||
      record.expiresAt < new Date()
    ) {
      throw new BadRequestException(
        'This reset link is invalid or has expired — ask your supervisor to send a new one, or the mobile number does not match the link.',
      );
    }

    const user = await this.db.user.findFirst({ where: { mobile } });
    if (!user) {
      throw new NotFoundException('User account not found');
    }

    const hash = await bcrypt.hash(input.newPassword, 10);

    // Set BOTH credentials: login accepts either, and after a "forgot PIN"
    // the old PIN must stop working.
    await this.db.user.update({
      where: { id: user.id },
      data: { passwordHash: hash, pinHash: hash },
    });

    await this.db.otp.delete({
      where: {
        type_target: {
          type: AuthService.RESET_LINK_OTP_TYPE,
          target: mobile,
        },
      },
    });

    await this.activityLogsService.log(
      user.id,
      'PASSWORD_RESET',
      'USER',
      user.id,
    );

    return {
      success: true,
      message: 'PIN reset successfully — log in to the app with your new PIN.',
    };
  }

  async createPassword(mobile: string, password: any) {
    const user = await this.db.user.findFirst({
      where: { mobile },
    });

    if (!user) {
      throw new NotFoundException('User account with this mobile number not found');
    }

    // One-shot activation only: once the account has been activated (or has
    // ever logged in), this route must not overwrite credentials — otherwise
    // anyone who knows a worker's mobile number could take over the account.
    if (user.mobileVerified || user.lastLoginAt) {
      throw new BadRequestException(
        'Account is already active — use reset password instead',
      );
    }

    const passwordHash = await bcrypt.hash(password, 10);

    await this.db.user.update({
      where: { id: user.id },
      data: {
        passwordHash,
        mobileVerified: true,
        status: 'ACTIVE',
      },
    });

    return {
      success: true,
      message: 'Password created successfully and account activated.',
    };
  }
}

