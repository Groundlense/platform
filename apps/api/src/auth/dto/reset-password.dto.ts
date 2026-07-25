import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsEmail,
  IsNotEmpty,
  IsOptional,
  IsString,
  MinLength,
} from 'class-validator';

export class ResetPasswordDto {
  @ApiPropertyOptional({ description: 'User email address' })
  @IsOptional()
  @IsEmail()
  email?: string;

  @ApiPropertyOptional({ description: 'User mobile number (field workers)' })
  @IsOptional()
  @IsString()
  @IsNotEmpty()
  mobile?: string;

  @ApiProperty({ description: '6-digit verification code' })
  @IsString()
  @IsNotEmpty()
  code: string;

  // Min 4, not 8: field workers use short numeric PINs (the activation flow
  // accepts 4+), and a reset must not demand a stronger secret than login.
  @ApiProperty({ description: 'New password or PIN' })
  @IsString()
  @MinLength(4)
  newPassword: string;
}
