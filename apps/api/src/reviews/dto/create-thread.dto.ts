import { ApiProperty } from '@nestjs/swagger';
import {
  IsNotEmpty,
  IsOptional,
  IsString,
  IsUUID,
} from 'class-validator';

export class CreateThreadDto {
  @ApiProperty({
    description:
      'Optional borehole interval this query refers to (must belong to the borehole in the URL)',
    required: false,
  })
  @IsOptional()
  @IsUUID()
  intervalId?: string;

  @ApiProperty({
    description:
      'First message of the query thread raised to the field worker',
  })
  @IsString()
  @IsNotEmpty()
  message: string;
}
