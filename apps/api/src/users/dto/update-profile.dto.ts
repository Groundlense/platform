import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsEmail, IsOptional, IsString } from 'class-validator';

export class UpdateProfileDto {
  @ApiPropertyOptional({
    description: 'Updated email address of the user',
    example: 'john.doe@groundlense.com',
  })
  @IsOptional()
  @IsEmail()
  email?: string;

  @ApiPropertyOptional({
    description: 'Updated mobile number of the user',
    example: '9876543210',
  })
  @IsOptional()
  @IsString()
  mobile?: string;
}
