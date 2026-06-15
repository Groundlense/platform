import { ApiProperty } from '@nestjs/swagger';
import {
  IsEnum,
} from 'class-validator';

import {
  UserStatus,
} from '@prisma/client';

export class UpdateUserStatusDto {
  @ApiProperty({
    description: 'New account status for the user (e.g. active, suspended)',
    enum: UserStatus,
  })
  @IsEnum(UserStatus)
  status: UserStatus;
}
