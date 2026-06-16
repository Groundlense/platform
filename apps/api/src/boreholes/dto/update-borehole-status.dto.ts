import { ApiProperty } from '@nestjs/swagger';
import {
  IsEnum,
} from 'class-validator';

import {
  BoreholeStatus,
} from '@prisma/client';

export class UpdateBoreholeStatusDto {
  @ApiProperty({
    description: 'New lifecycle status of the borehole (e.g. planned, in progress, completed)',
    enum: BoreholeStatus,
  })
  @IsEnum(BoreholeStatus)
  status: BoreholeStatus;
}
