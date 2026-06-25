import {
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { OrganizationType } from '@prisma/client';
import { DatabaseService } from '../database/database.service';
import { ProjectAccessService } from '../common/access/project-access.service';
import { ActivityLogsService } from '../activity-logs/activity-logs.service';
import { CreateOrganizationDto } from './dto/create-organization.dto';
import { UpdateOrganizationDto } from './dto/update-organization.dto';
import { InviteMembersDto } from './dto/invite-members.dto';
import * as crypto from 'crypto';
import * as bcrypt from 'bcrypt';
import { sendEmail } from '../common/email.helper';

interface AuthUser {
  id: string;
  organizationId?: string;
  roles?: any;
}

// Directory listing never exposes statutory identifiers (GSTIN/PAN) —
// those are only visible on the full profile to the org's own members.
const DIRECTORY_SELECT = {
  id: true,
  name: true,
  type: true,
  city: true,
  state: true,
} as const;

@Injectable()
export class OrganizationsService {
  constructor(
    private readonly db: DatabaseService,
    private readonly access: ProjectAccessService,
    private readonly activityLogsService: ActivityLogsService,
  ) {}

  async findAll(type?: OrganizationType) {
    return this.db.organization.findMany({
      where: type ? { type } : undefined,
      select: DIRECTORY_SELECT,
      orderBy: {
        name: 'asc',
      },
    });
  }

  async findOne(organizationId: string, user: AuthUser) {
    const organization = await this.db.organization.findUnique({
      where: { id: organizationId },
    });

    if (!organization) {
      throw new NotFoundException('Organization not found');
    }

    // Full profile (GSTIN, PAN, subscription, ...) is restricted to
    // members of the organization or SUPER_ADMIN.
    this.access.assertSameOrganization(user, organization.id);

    return organization;
  }

  async create(dto: CreateOrganizationDto, user: AuthUser) {
    // Normal company creation happens through public /auth/register;
    // only the Groundlense super admin may create arbitrary orgs here.
    if (!this.access.isSuperAdmin(user)) {
      throw new ForbiddenException(
        'Only the platform administrator can create organizations directly',
      );
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

    await this.activityLogsService.log(
      user.id,
      'ORGANIZATION_CREATED',
      'ORGANIZATION',
      organization.id,
      {
        name: organization.name,
        type: organization.type,
      },
    );

    return organization;
  }

  async update(
    organizationId: string,
    dto: UpdateOrganizationDto,
    user: AuthUser,
  ) {
    const organization = await this.db.organization.findUnique({
      where: { id: organizationId },
      select: { id: true },
    });

    if (!organization) {
      throw new NotFoundException('Organization not found');
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

    await this.activityLogsService.log(
      user.id,
      'ORGANIZATION_UPDATED',
      'ORGANIZATION',
      organizationId,
      {
        updatedFields: Object.keys(dto),
      },
    );

    return updated;
  }

  // Groundlense-admin action per the RBAC spec ("Verify company KYC").
  // The Organization model carries isVerified/verifiedAt for this.
  async verifyKyc(organizationId: string, user: AuthUser) {
    const organization = await this.db.organization.findUnique({
      where: { id: organizationId },
      select: { id: true, name: true },
    });

    if (!organization) {
      throw new NotFoundException('Organization not found');
    }

    const updated = await this.db.organization.update({
      where: { id: organizationId },
      data: {
        isVerified: true,
        verifiedAt: new Date(),
      },
    });

    await this.activityLogsService.log(
      user.id,
      'ORGANIZATION_KYC_VERIFIED',
      'ORGANIZATION',
      organizationId,
      {
        name: organization.name,
      },
    );

    return updated;
  }

  async inviteMembers(
    dto: InviteMembersDto,
    user: { id: string; organizationId: string },
  ) {
    const results: Record<string, unknown>[] = [];

    const organizationId = user.organizationId;
    const org = await this.db.organization.findUnique({
      where: { id: organizationId },
    });

    if (!org) {
      throw new NotFoundException('Organization not found');
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

          await this.activityLogsService.log(
            user.id,
            'MEMBER_ADDED',
            'USER',
            existingUser.id,
            {
              email: emailOrCode,
              role: roleCode,
              organizationName: org.name,
            },
          );
          void this.sendAddedToOrgEmail(emailOrCode, org.name);

          results.push({
            emailOrCode,
            employeeCode: existingUser.employeeCode,
            status: 'EXISTING',
            message: 'User already in database',
          });
        } else {
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

          const token = crypto.randomBytes(16).toString('hex');
          const passwordHash = await bcrypt.hash(
            crypto.randomBytes(8).toString('hex'),
            10,
          );

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

          const webUrl = process.env.WEB_URL || 'http://localhost:3000';
          const inviteLink = `${webUrl}/register/invite?token=${token}`;
          console.log(
            `[INVITE] Member invite link for ${emailOrCode}: ${inviteLink}`,
          );

          await this.activityLogsService.log(
            user.id,
            'MEMBER_INVITED',
            'USER',
            newUser.id,
            {
              email: emailOrCode,
              role: roleCode,
              organizationName: org.name,
            },
          );
          void this.sendInviteEmail(emailOrCode, inviteLink, org.name);

          results.push({
            emailOrCode,
            employeeCode: newUser.employeeCode,
            status: 'INVITED',
            inviteLink,
          });
        }
      } else {
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
          await this.activityLogsService.log(
            user.id,
            'MEMBER_ADDED',
            'USER',
            existingUser.id,
            {
              email: existingUser.email,
              role: roleCode,
              organizationName: org.name,
            },
          );
          if (existingUser.email) {
            void this.sendAddedToOrgEmail(existingUser.email, org.name);
          }

          results.push({
            emailOrCode,
            employeeCode: existingUser.employeeCode,
            status: 'EXISTING',
            message: 'User already in database',
          });
        } else {
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

  private async sendInviteEmail(email: string, inviteLink: string, orgName: string): Promise<void> {
    const subject = `Invitation to join ${orgName} on GroundLense`;
    const text = `You have been invited to join ${orgName} on GroundLense. Click the following link to set up your account: ${inviteLink}`;
    const html = `
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
    `;

    await sendEmail({
      to: email,
      subject,
      text,
      html,
    });
  }

  private async sendAddedToOrgEmail(email: string, orgName: string): Promise<void> {
    const subject = `You have been added to ${orgName} on GroundLense`;
    const text = `You have been added to the organization ${orgName} on GroundLense. You can now log in to access your organization dashboard.`;
    const webUrl = process.env.WEB_URL || 'http://localhost:3000';
    const html = `
      <div style="font-family: sans-serif; padding: 20px; color: #333;">
        <h2 style="color: #4f46e5;">Organization Update</h2>
        <p>Hello,</p>
        <p>You have been added to the organization <strong>${orgName}</strong> on GroundLense.</p>
        <p>You can now log in using your existing credentials to access your new organization's dashboard.</p>
        <div style="margin: 30px 0;">
          <a href="${webUrl}/login" style="background-color: #4f46e5; color: white; padding: 12px 24px; text-decoration: none; font-weight: bold; border-radius: 6px; display: inline-block;">
            Log In Now
          </a>
        </div>
      </div>
    `;

    await sendEmail({
      to: email,
      subject,
      text,
      html,
    });
  }

  async getJoinRequests(user: AuthUser) {
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

  async approveJoinRequest(requestId: string, user: AuthUser) {
    const organizationId = user.organizationId;
    const req = await this.db.joinRequest.findUnique({
      where: { id: requestId },
    });

    if (!req || req.organizationId !== organizationId) {
      throw new NotFoundException('Join request not found');
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

    await this.activityLogsService.log(
      user.id,
      'JOIN_REQUEST_APPROVED',
      'USER',
      req.userId,
      { requestId },
    );

    return { success: true, message: 'User approved successfully.' };
  }

  async rejectJoinRequest(requestId: string, user: AuthUser) {
    const organizationId = user.organizationId;
    const req = await this.db.joinRequest.findUnique({
      where: { id: requestId },
    });

    if (!req || req.organizationId !== organizationId) {
      throw new NotFoundException('Join request not found');
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

    await this.activityLogsService.log(
      user.id,
      'JOIN_REQUEST_REJECTED',
      'USER',
      req.userId,
      { requestId },
    );

    return { success: true, message: 'User request rejected.' };
  }
}
