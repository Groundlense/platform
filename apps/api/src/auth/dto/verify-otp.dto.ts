import { ApiProperty } from '@nestjs/swagger';
import { IsEnum, IsNotEmpty, IsString, Length } from 'class-validator';

export class VerifyOtpDto {
  @ApiProperty({ description: 'OTP type', enum: ['EMAIL', 'MOBILE'] })
  @IsEnum(['EMAIL', 'MOBILE'])
  type: 'EMAIL' | 'MOBILE';

  @ApiProperty({ description: 'Target email address or mobile number' })
  @IsString()
  @IsNotEmpty()
  target: string;

  @ApiProperty({ description: '6-digit OTP code' })
  @IsString()
  @Length(6, 6)
  code: string;
}
