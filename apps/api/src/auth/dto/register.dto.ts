import {
  ApiProperty,
  ApiPropertyOptional,
} from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  IsEmail,
  IsEnum,
  IsNotEmpty,
  IsOptional,
  IsString,
  MinLength,
  ValidateNested,
} from 'class-validator';
import { OrganizationType } from '@prisma/client';

export class RegisterOrganizationDto {
  @ApiProperty({ description: 'Registered company name' })
  @IsString()
  @IsNotEmpty()
  name: string;

  @ApiProperty({
    description: 'Company type per the ERD',
    enum: OrganizationType,
  })
  @IsEnum(OrganizationType)
  type: OrganizationType;

  @ApiPropertyOptional({ description: 'GST identification number' })
  @IsOptional()
  @IsString()
  gstin?: string;

  @ApiPropertyOptional({ description: 'Company contact email' })
  @IsOptional()
  @IsEmail()
  email?: string;

  @ApiPropertyOptional({ description: 'Company contact phone number' })
  @IsOptional()
  @IsString()
  phone?: string;

  @ApiPropertyOptional({ description: 'City of the company office' })
  @IsOptional()
  @IsString()
  city?: string;

  @ApiPropertyOptional({ description: 'State of the company office' })
  @IsOptional()
  @IsString()
  state?: string;
}

export class RegisterAdminDto {
  @ApiProperty({ description: 'First name of the company admin' })
  @IsString()
  @IsNotEmpty()
  firstName: string;

  @ApiPropertyOptional({ description: 'Last name of the company admin' })
  @IsOptional()
  @IsString()
  lastName?: string;

  @ApiProperty({ description: 'Login email of the company admin' })
  @IsEmail()
  email: string;

  @ApiProperty({
    description: 'Account password (minimum 8 characters)',
    minLength: 8,
  })
  @IsString()
  @MinLength(8)
  password: string;

  @ApiPropertyOptional({ description: 'Mobile number of the company admin' })
  @IsOptional()
  @IsString()
  mobile?: string;
}

export class RegisterDto {
  @ApiProperty({
    description: 'Company being registered',
    type: RegisterOrganizationDto,
  })
  @ValidateNested()
  @Type(() => RegisterOrganizationDto)
  organization: RegisterOrganizationDto;

  @ApiProperty({
    description: 'First admin user of the company',
    type: RegisterAdminDto,
  })
  @ValidateNested()
  @Type(() => RegisterAdminDto)
  admin: RegisterAdminDto;
}
