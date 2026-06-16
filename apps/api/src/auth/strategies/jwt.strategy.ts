import {
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';

import { ExtractJwt, Strategy } from 'passport-jwt';
import { DatabaseService } from '../../database/database.service';

@Injectable()
export class JwtStrategy extends PassportStrategy(
  Strategy,
  'jwt',
) {
  constructor(
  private readonly db: DatabaseService,
) {
  super({
    jwtFromRequest:
      ExtractJwt.fromAuthHeaderAsBearerToken(),

    ignoreExpiration: false,

    secretOrKey:
      process.env.JWT_ACCESS_SECRET!,
  });
}

  async validate(payload: any) {
    const user = await this.db.user.findUnique({
      where: {
        id: payload.sub,
      },
      include: {
        organization: true,
        roles: {
          include: {
            role: {
              include: {
                rolePermissions: {
                  include: {
                    permission: true,
                  },
                },
              },
            },
          },
        },
      },
    });

    if (!user || user.status !== 'ACTIVE') {
      throw new UnauthorizedException(
        'User no longer active',
      );
    }

    const roles = user.roles.map(
      (r) => r.role.code,
    );

    const permissions = user.roles.flatMap(
      (r) =>
        r.role.rolePermissions.map(
          (rp) => rp.permission.code,
        ),
    );

    return {
      id: user.id,
      organizationId: user.organizationId,
      firstName: user.firstName,
      lastName: user.lastName,
      employeeCode: user.employeeCode,
      email: user.email,
      organization: user.organization,
      roles,
      permissions,
    };
  }
}

