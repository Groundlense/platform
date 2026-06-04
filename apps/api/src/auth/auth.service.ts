import {
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';

import { JwtService } from '@nestjs/jwt';

import * as bcrypt from 'bcrypt';
import * as crypto from 'crypto';

import { UsersService } from '../users/users.service';
import { DatabaseService } from '../database/database.service'
import { ActivityLogsService } from '../activity-logs/activity-logs.service';
@Injectable()
export class AuthService {
  constructor(
    private readonly usersService: UsersService,
    private readonly jwtService: JwtService,
    private readonly db: DatabaseService,
    private readonly activityLogsService: ActivityLogsService,
  ) {}

  private async hashToken(
    token: string,
  ) {
    return bcrypt.hash(token, 10);
  }

  private generateRefreshToken() {
    return crypto.randomUUID();
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

    let valid = false;

    if (user.employeeCode) {
      valid = await bcrypt.compare(
        password,
        user.pinHash ?? '',
      );
    } else {
      valid = await bcrypt.compare(
        password,
        user.passwordHash,
      );
    }

    if (!valid) {
      throw new UnauthorizedException(
        'Invalid credentials',
      );
    }

    const payload = {
      sub: user.id,
      organizationId: user.organizationId,
    };

    const accessToken =
      await this.jwtService.signAsync(
        payload,
      );

    const refreshToken =
      this.generateRefreshToken();

    const tokenHash =
      await this.hashToken(
        refreshToken,
      );
    
    await this.activityLogsService.log(
  user.id,
  'LOGIN',
  'USER',
  user.id,
);

    await this.db.refreshToken.create({
      data: {
        userId: user.id,
        tokenHash,
        expiresAt: new Date(
          Date.now() +
            30 *
              24 *
              60 *
              60 *
              1000,
        ),
      },
    });

    return {
      accessToken,
      refreshToken,
    };
  }

  async refresh(
    refreshToken: string,
  ) {
    const tokens =
      await this.db.refreshToken.findMany({
        where: {
          revokedAt: null,
          expiresAt: {
            gt: new Date(),
          },
        },
        include: {
          user: true,
        },
      });

    let matchedToken: any = null;

    for (const token of tokens) {
      const isValid =
        await bcrypt.compare(
          refreshToken,
          token.tokenHash,
        );

      if (isValid) {
        matchedToken = token;
        break;
      }
    }

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

    const payload = {
      sub: matchedToken.user.id,
      organizationId:
        matchedToken.user.organizationId,
    };

    const accessToken =
      await this.jwtService.signAsync(
        payload,
      );

    const newRefreshToken =
      this.generateRefreshToken();

    const tokenHash =
      await this.hashToken(
        newRefreshToken,
      );

    await this.db.refreshToken.create({
      data: {
        userId:
          matchedToken.user.id,
        tokenHash,
        expiresAt: new Date(
          Date.now() +
            30 *
              24 *
              60 *
              60 *
              1000,
        ),
      },
    });

    return {
      accessToken,
      refreshToken:
        newRefreshToken,
    };
  }
  async logout(
  refreshToken: string,
) {
  const tokens =
    await this.db.refreshToken.findMany({
      where: {
        revokedAt: null,
      },
    });

  for (const token of tokens) {
    const isValid =
      await bcrypt.compare(
        refreshToken,
        token.tokenHash,
      );

    if (isValid) {
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

  throw new UnauthorizedException(
    'Invalid refresh token',
  );
}
}