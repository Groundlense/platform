import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsDateString,
  IsOptional,
  IsString,
  IsUUID,
} from 'class-validator';

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
    description: 'Description of the project scope and investigation requirements',
    example: 'Soil investigation for proposed flyover — 12 boreholes to 30 m depth with SPT at 1.5 m intervals',
  })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiProperty({
    description: 'ID of the geotechnical organization executing the investigation',
    example: 'a1b2c3d4-e5f6-4a7b-8c9d-0e1f2a3b4c5d',
  })
  @IsString()
  geotechOrganizationId: string;

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
}
