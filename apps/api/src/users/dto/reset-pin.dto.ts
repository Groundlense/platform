import { ApiProperty } from '@nestjs/swagger';
import {
  IsString,
  Length,
} from 'class-validator';

export class ResetPinDto {
  @ApiProperty({
    description: 'New 4-digit login PIN for the field worker',
    example: '4321',
    minLength: 4,
    maxLength: 4,
  })
  @IsString()
  @Length(4, 4)
  pin: string;
}
