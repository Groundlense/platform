import { Injectable } from '@nestjs/common';
import { DatabaseService } from '../database/database.service';
import * as bcrypt from 'bcrypt';
import { CreateUserDto } from './dto/create-user.dto';
import { UserStatus } from '@prisma/client';
@Injectable()
export class UsersService {
  constructor(private readonly db: DatabaseService) {}

  async findByIdentifier(identifier: string) {
    return this.db.user.findFirst({
      where: {
        OR: [
          { email: identifier },
          { employeeCode: identifier },
        ],
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
  async findAll() {
  return this.db.user.findMany({
    include: {
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
async createUser(
  dto: CreateUserDto,
) {
  const defaultPassword =
    'Password@123';

  const passwordHash =
    await bcrypt.hash(
      defaultPassword,
      10,
    );

  const user =
    await this.db.user.create({
      data: {
        organizationId:
          dto.organizationId,

        firstName:
          dto.firstName,

        lastName:
          dto.lastName,

        email:
          dto.email,

        employeeCode:
          dto.employeeCode,

        passwordHash,
      },
    });

  const role =
    await this.db.role.findUnique({
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

    defaultPassword,
  };
}
async updateStatus(
  userId: string,
  status: UserStatus,
) {
  return this.db.user.update({
    where: {
      id: userId,
    },

    data: {
      status,
    },
  });
}
async findOne(
  userId: string,
) {
  return this.db.user.findUnique({
    where: {
      id: userId,
    },

    include: {
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
async resetPin(
  userId: string,
  pin: string,
) {
  const pinHash =
    await bcrypt.hash(
      pin,
      10,
    );

  return this.db.user.update({
    where: {
      id: userId,
    },

    data: {
      pinHash,
    },
  });
}
}