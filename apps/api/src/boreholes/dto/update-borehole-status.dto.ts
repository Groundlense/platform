import {
  IsEnum,
} from 'class-validator';

import {
  BoreholeStatus,
} from '@prisma/client';

export class UpdateBoreholeStatusDto {
  @IsEnum(BoreholeStatus)
  status: BoreholeStatus;
}