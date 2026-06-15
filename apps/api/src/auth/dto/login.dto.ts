import { ApiProperty } from '@nestjs/swagger';
import { IsString } from 'class-validator';

export class LoginDto {
  @ApiProperty({
    description: 'Login identifier — email address or employee code',
    example: 'engineer@groundlense.com',
  })
  @IsString()
  identifier: string;

  @ApiProperty({
    description: 'Account password (or PIN for field workers)',
    example: 'P@ssw0rd!',
  })
  @IsString()
  password: string;
}
