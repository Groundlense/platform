import {
  ConflictException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';

import { JwtService } from '@nestjs/jwt';

import * as bcrypt from 'bcrypt';
import * as crypto from 'crypto';

import { UsersService } from '../users/users.service';
import { DatabaseService } from '../database/database.service'
import { ActivityLogsService } from '../activity-logs/activity-logs.service';
import { RegisterDto } from './dto/register.dto';
@Injectable()
export class AuthService {
  constructor(
    private readonly usersService: UsersService,
    private readonly jwtService: JwtService,
    private readonly db: DatabaseService,
    private readonly activityLogsService: ActivityLogsService,
  ) {}

  // Refresh tokens are high-entropy random values, so a deterministic
  // SHA-256 lets us look the row up directly instead of bcrypt-comparing
  // against every stored token.
  private hashToken(token: string) {
    return crypto
      .createHash('sha256')
      .update(token)
      .digest('hex');
  }

  private generateRefreshToken() {
    return crypto
      .randomBytes(48)
      .toString('base64url');
  }

  // Single place that mints the access/refresh token pair so login,
  // refresh and register all share the same hashing/expiry behaviour.
  private async issueTokens(
    userId: string,
    organizationId: string,
  ) {
    const accessToken =
      await this.jwtService.signAsync({
        sub: userId,
        organizationId,
      });

    const refreshToken =
      this.generateRefreshToken();

    await this.db.refreshToken.create({
      data: {
        userId,
        tokenHash: this.hashToken(refreshToken),
        expiresAt: new Date(
          Date.now() +
            30 * 24 * 60 * 60 * 1000,
        ),
      },
    });

    return {
      accessToken,
      refreshToken,
    };
  }

  async login(
    identifier: string,
    password: string,
  ) {
    const user =
      await this.usersService.findByIdentifier(
        identifier,
      );

    if (!user) {
      throw new UnauthorizedException(
        'Invalid credentials',
      );
    }

    if (
  user.status !== 'ACTIVE'
) {
  throw new UnauthorizedException(
    'User account inactive',
  );
}

    // Accept the account password or, for field workers, the PIN —
    // a user with an employee code must still be able to use their password.
    let valid = await bcrypt.compare(
      password,
      user.passwordHash,
    );

    if (!valid && user.pinHash) {
      valid = await bcrypt.compare(
        password,
        user.pinHash,
      );
    }

    if (!valid) {
      throw new UnauthorizedException(
        'Invalid credentials',
      );
    }

    await this.activityLogsService.log(
      user.id,
      'LOGIN',
      'USER',
      user.id,
    );

    return this.issueTokens(
      user.id,
      user.organizationId,
    );
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
    const existingUser =
      await this.db.user.findUnique({
        where: { email: dto.admin.email },
        select: { id: true },
      });

    if (existingUser) {
      throw new ConflictException(
        'A user with this email already exists',
      );
    }

    // gstin is not a unique column in the schema, so we enforce
    // uniqueness here to avoid duplicate company registrations.
    if (dto.organization.gstin) {
      const existingOrg =
        await this.db.organization.findFirst({
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

    const passwordHash = await bcrypt.hash(
      dto.admin.password,
      10,
    );

    const user = await this.db.$transaction(
      async (tx) => {
        const organization =
          await tx.organization.create({
            data: {
              name: dto.organization.name,
              type: dto.organization.type,
              gstin: dto.organization.gstin,
              email: dto.organization.email,
              phone: dto.organization.phone,
              city: dto.organization.city,
              state: dto.organization.state,
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

        return admin;
      },
    );

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

    return this.issueTokens(
      user.id,
      user.organizationId,
    );
  }

  async refresh(
    refreshToken: string,
  ) {
    const matchedToken =
      await this.db.refreshToken.findFirst({
        where: {
          tokenHash:
            this.hashToken(refreshToken),
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
      throw new UnauthorizedException(
        'Invalid refresh token',
      );
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
  async logout(
  refreshToken: string,
) {
  const token =
    await this.db.refreshToken.findFirst({
      where: {
        tokenHash:
          this.hashToken(refreshToken),
        revokedAt: null,
      },
    });

  if (!token) {
    throw new UnauthorizedException(
      'Invalid refresh token',
    );
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
}