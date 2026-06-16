import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsEmail,
  IsOptional,
  IsString,
} from 'class-validator';

export class CreateUserDto {
  @ApiProperty({
    description: 'ID of the organization the user belongs to',
    example: 'a1b2c3d4-e5f6-4a7b-8c9d-0e1f2a3b4c5d',
  })
  @IsString()
  organizationId: string;

  @ApiProperty({
    description: 'First name of the user',
    example: 'Ravi',
  })
  @IsString()
  firstName: string;

  @ApiPropertyOptional({
    description: 'Last name of the user',
    example: 'Sharma',
  })
  @IsOptional()
  @IsString()
  lastName?: string;

  @ApiPropertyOptional({
    description: 'Email address of the user (used as login identifier when provided)',
    example: 'ravi.sharma@groundlense.com',
  })
  @IsOptional()
  @IsEmail()
  email?: string;

  @ApiPropertyOptional({
    description: 'Internal employee code (alternative login identifier for field staff)',
    example: 'EMP-0042',
  })
  @IsOptional()
  @IsString()
  employeeCode?: string;

  @ApiProperty({
    description: 'Role code to assign to the user (e.g. ADMIN, ENGINEER, FIELD_WORKER)',
    example: 'FIELD_WORKER',
  })
  @IsString()
  roleCode: string;

  @ApiPropertyOptional({
    description: 'Designation / role name of the user',
    example: 'Driller',
  })
  @IsOptional()
  @IsString()
  designation?: string;

  @ApiPropertyOptional({
    description: 'User type / qualification of the user',
    example: 'ITI',
  })
  @IsOptional()
  @IsString()
  userType?: string;

  @ApiPropertyOptional({
    description: 'Preferred language / status of the user',
    example: 'On site',
  })
  @IsOptional()
  @IsString()
  preferredLanguage?: string;
}

