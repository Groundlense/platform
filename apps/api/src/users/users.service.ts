import {
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { DatabaseService } from '../database/database.service';
import * as bcrypt from 'bcrypt';
import * as crypto from 'crypto';
import { CreateUserDto } from './dto/create-user.dto';
import { UserStatus } from '@prisma/client';

const SAFE_USER_SELECT = {
  id: true,
  organizationId: true,
  employeeCode: true,
  firstName: true,
  lastName: true,
  email: true,
  mobile: true,
  status: true,
  lastLoginAt: true,
  userType: true,
  designation: true,
  profilePhotoUrl: true,
  preferredLanguage: true,
  createdAt: true,
  updatedAt: true,
} as const;

@Injectable()
export class UsersService {
  constructor(private readonly db: DatabaseService) {}

  private isSuperAdmin(actor: any): boolean {
    return actor?.roles?.includes('SUPER_ADMIN') ?? false;
  }

  private async assertSameOrganization(actor: any, userId: string) {
    const target = await this.db.user.findUnique({
      where: { id: userId },
      select: { id: true, organizationId: true },
    });

    if (!target) {
      throw new NotFoundException('User not found');
    }

    if (
      !this.isSuperAdmin(actor) &&
      target.organizationId !== actor.organizationId
    ) {
      throw new ForbiddenException('User belongs to another organization');
    }

    return target;
  }

  // Used by auth only — includes credential hashes, never expose via API.
  async findByIdentifier(identifier: string) {
    return this.db.user.findFirst({
      where: {
        OR: [{ email: identifier }, { employeeCode: identifier }],
      },
      include: {
        roles: {
          include: {
            role: true,
          },
        },
      },
    });
  }

  async findAll(actor: any) {
    return this.db.user.findMany({
      where: this.isSuperAdmin(actor)
        ? undefined
        : { organizationId: actor.organizationId },
      select: {
        ...SAFE_USER_SELECT,
        roles: {
          include: {
            role: true,
          },
        },
      },
      orderBy: {
        firstName: 'asc',
      },
    });
  }

  async createUser(dto: CreateUserDto, actor: any) {
    // Non-admins may only create users inside their own organization.
    const organizationId = this.isSuperAdmin(actor)
      ? dto.organizationId
      : actor.organizationId;

    const oneTimePassword = crypto.randomBytes(9).toString('base64url');

    const passwordHash = await bcrypt.hash(oneTimePassword, 10);

    let employeeCode = dto.employeeCode?.trim() || null;
    if (!employeeCode) {
      const org = await this.db.organization.findUnique({
        where: { id: organizationId },
        select: { type: true },
      });

      let prefix = 'GL-W';
      if (dto.roleCode === 'FIELD_WORKER' || dto.roleCode === 'WORKER') {
        prefix = 'GL-W';
      } else if (dto.roleCode === 'DRILLER') {
        prefix = 'GL-D';
      } else if (dto.roleCode === 'LAB_TECHNICIAN') {
        prefix = 'GL-L';
      } else if (dto.roleCode === 'PROJECT_MANAGER' || dto.roleCode === 'PM') {
        prefix = 'GL-GEO';
      } else if (org?.type === 'EPC_CONTRACTOR') {
        prefix = 'GL-CON';
      } else if (org?.type === 'GEOTECH_CONTRACTOR') {
        prefix = 'GL-GEO';
      } else if (org?.type === 'CLIENT') {
        prefix = 'GL-CL';
      } else if (org?.type === 'NABL_LAB') {
        prefix = 'GL-LAB';
      } else if (org?.type === 'IE_FIRM') {
        prefix = 'GL-ENG';
      } else if (org?.type === 'STRUCTURAL_CONSULTANT') {
        prefix = 'GL-STR';
      }

      let isUnique = false;
      let attempts = 0;
      while (!isUnique && attempts < 10) {
        const randNum = Math.floor(1000 + Math.random() * 9000);
        const candidate = `${prefix}-${randNum}`;
        const existing = await this.db.user.findUnique({
          where: { employeeCode: candidate },
        });
        if (!existing) {
          employeeCode = candidate;
          isUnique = true;
        }
        attempts++;
      }
    }

    const user = await this.db.user.create({
      data: {
        organizationId,
        firstName: dto.firstName,
        lastName: dto.lastName,
        email: dto.email,
        employeeCode,
        passwordHash,
        designation: dto.designation,
        userType: dto.userType,
        preferredLanguage: dto.preferredLanguage,
      },
      select: SAFE_USER_SELECT,
    });

    const role = await this.db.role.findUnique({
      where: {
        code: dto.roleCode,
      },
    });

    if (role) {
      await this.db.userRole.create({
        data: {
          userId: user.id,
          roleId: role.id,
        },
      });
    }

    return {
      user,
      // One-time credential for first login; user must change it.
      oneTimePassword,
    };
  }

  async updateStatus(userId: string, status: UserStatus, actor: any) {
    await this.assertSameOrganization(actor, userId);

    return this.db.user.update({
      where: {
        id: userId,
      },
      data: {
        status,
      },
      select: SAFE_USER_SELECT,
    });
  }

  async findOne(userId: string, actor: any) {
    await this.assertSameOrganization(actor, userId);

    return this.db.user.findUnique({
      where: {
        id: userId,
      },
      select: {
        ...SAFE_USER_SELECT,
        roles: {
          include: {
            role: true,
          },
        },
        teamMemberships: {
          include: {
            team: true,
          },
        },
      },
    });
  }

  async resetPin(userId: string, pin: string, actor: any) {
    await this.assertSameOrganization(actor, userId);

    const pinHash = await bcrypt.hash(pin, 10);

    return this.db.user.update({
      where: {
        id: userId,
      },
      data: {
        pinHash,
      },
      select: SAFE_USER_SELECT,
    });
  }
}
