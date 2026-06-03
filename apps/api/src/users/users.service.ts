import { Injectable } from '@nestjs/common';
import { DatabaseService } from '../database/database.service';

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
}