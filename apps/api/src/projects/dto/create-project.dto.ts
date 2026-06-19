import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsDateString, IsOptional, IsString, IsUUID } from 'class-validator';

export class CreateProjectDto {
  @ApiProperty({
    description: 'Unique project code used on reports and borelogs',
    example: 'GL-2026-014',
  })
  @IsString()
  projectCode: string;

  @ApiProperty({
    description: 'Project name',
    example: 'NH-48 Flyover Geotechnical Investigation',
  })
  @IsString()
  name: string;

  @ApiPropertyOptional({
    description:
      'Description of the project scope and investigation requirements',
    example:
      'Soil investigation for proposed flyover — 12 boreholes to 30 m depth with SPT at 1.5 m intervals',
  })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiPropertyOptional({
    description: 'Indian state where the project is located',
    example: 'Maharashtra',
  })
  @IsOptional()
  @IsString()
  state?: string;

  @ApiPropertyOptional({
    description:
      'ID of the geotechnical organization executing the investigation',
    example: 'a1b2c3d4-e5f6-4a7b-8c9d-0e1f2a3b4c5d',
  })
  @IsOptional()
  @IsString()
  geotechOrganizationId?: string;

  @ApiPropertyOptional({
    description: 'Planned start date of fieldwork (ISO 8601)',
    example: '2026-07-01',
  })
  @IsOptional()
  @IsDateString()
  startDate?: string;

  @ApiPropertyOptional({
    description: 'Planned end date of fieldwork (ISO 8601)',
    example: '2026-09-30',
  })
  @IsOptional()
  @IsDateString()
  endDate?: string;

  @ApiPropertyOptional({
    description: 'Tender ID',
    example: 'TND-2026-902',
  })
  @IsOptional()
  @IsString()
  tenderId?: string;

  @ApiPropertyOptional({
    description: 'Target completion date of fieldwork (ISO 8601)',
    example: '2026-12-31',
  })
  @IsOptional()
  @IsDateString()
  targetCompletionDate?: string;

  @ApiPropertyOptional({
    description: 'ID of the EPC organization (required if creator is Geotech/Superadmin)',
    example: 'b2c3d4e5-f6a7-4b8c-9d0e-1f2a3b4c5d6e',
  })
  @IsOptional()
  @IsString()
  epcOrganizationId?: string;

  @ApiPropertyOptional({
    description: 'Email or employee code of the partner to resolve organization',
    example: 'contractor@geotech.com',
  })
  @IsOptional()
  @IsString()
  partnerSearchQuery?: string;
}
