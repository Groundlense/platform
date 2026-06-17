import { ApiProperty } from '@nestjs/swagger';
import { IsEnum, IsNotEmpty, IsString } from 'class-validator';

export class SendOtpDto {
  @ApiProperty({ description: 'OTP type', enum: ['EMAIL', 'MOBILE'] })
  @IsEnum(['EMAIL', 'MOBILE'])
  type: 'EMAIL' | 'MOBILE';

  @ApiProperty({ description: 'Target email address or mobile number' })
  @IsString()
  @IsNotEmpty()
  target: string;
}
