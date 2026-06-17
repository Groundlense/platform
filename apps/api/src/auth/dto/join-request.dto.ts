import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsEmail,
  IsNotEmpty,
  IsOptional,
  IsString,
  MinLength,
} from 'class-validator';

export class JoinRequestDto {
  @ApiProperty({ description: 'GSTIN of the organization to join' })
  @IsString()
  @IsNotEmpty()
  gstin: string;

  @ApiProperty({ description: 'First name' })
  @IsString()
  @IsNotEmpty()
  firstName: string;

  @ApiPropertyOptional({ description: 'Last name' })
  @IsOptional()
  @IsString()
  lastName?: string;

  @ApiProperty({ description: 'Work email' })
  @IsEmail()
  email: string;

  @ApiPropertyOptional({ description: 'Mobile number' })
  @IsOptional()
  @IsString()
  mobile?: string;

  @ApiProperty({ description: 'Requested password (min 8 characters)' })
  @IsString()
  @MinLength(8)
  password: string;

  @ApiProperty({ description: 'Role code to join as (e.g., GEOTECH_ENGINEER)' })
  @IsString()
  @IsNotEmpty()
  roleCode: string;
}
