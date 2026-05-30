import {
  UnauthorizedException,
  Injectable,
} from '@nestjs/common';

import * as bcrypt from 'bcrypt';

import { JwtService } from '@nestjs/jwt';

import { UsersService } from '../users/users.service';

@Injectable()
export class AuthService {
  constructor(
    private readonly usersService: UsersService,
    private readonly jwtService: JwtService,
  ) {}

  async login(identifier: string, password: string) {
    const user =
      await this.usersService.findByIdentifier(identifier);

    if (!user) {
      throw new UnauthorizedException('Invalid credentials');
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
      throw new UnauthorizedException('Invalid credentials');
    }

    const payload = {
      sub: user.id,
      organizationId: user.organizationId,
    };

    const accessToken =
      await this.jwtService.signAsync(payload);

    return {
      accessToken,
    };
  }
}