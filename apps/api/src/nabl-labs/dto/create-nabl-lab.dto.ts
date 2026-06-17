import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsString,
  IsNotEmpty,
  IsObject,
  IsDateString,
  IsOptional,
} from 'class-validator';

export class CreateNablLabDto {
  @ApiProperty({ description: 'Organization ID associated with the lab' })
  @IsString()
  @IsNotEmpty()
  companyId: string;

  @ApiProperty({ description: 'NABL certification identifier code' })
  @IsString()
  @IsNotEmpty()
  nablCertNumber: string;

  @ApiProperty({ description: 'Official name of the lab' })
  @IsString()
  @IsNotEmpty()
  labName: string;

  @ApiProperty({ description: 'JSON structure listing accredited tests' })
  @IsObject()
  @IsNotEmpty()
  accreditedTests: any;

  @ApiProperty({ description: 'Certification validity start date' })
  @IsDateString()
  @IsNotEmpty()
  certValidFrom: string;

  @ApiProperty({ description: 'Certification validity end date' })
  @IsDateString()
  @IsNotEmpty()
  certValidUntil: string;

  @ApiPropertyOptional({ description: 'URL link to certificate document' })
  @IsString()
  @IsOptional()
  verificationDocUrl?: string;
}
