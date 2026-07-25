import { ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsDateString,
  IsNumber,
  IsOptional,
  IsString,
  Max,
  Min,
} from 'class-validator';

export class UpdateProjectDto {
  @ApiPropertyOptional({
    description: 'Project name',
    example: 'NH-48 Flyover Geotechnical Investigation',
  })
  @IsOptional()
  @IsString()
  name?: string;

  @ApiPropertyOptional({
    description: 'Indian state where the project is located',
    example: 'Maharashtra',
  })
  @IsOptional()
  @IsString()
  state?: string;

  @ApiPropertyOptional({
    description: 'Planned start date of fieldwork (ISO 8601)',
    example: '2026-07-01',
  })
  @IsOptional()
  @IsDateString()
  startDate?: string;

  @ApiPropertyOptional({
    description: 'Planned end / target completion date of fieldwork (ISO 8601)',
    example: '2026-12-31',
  })
  @IsOptional()
  @IsDateString()
  endDate?: string;

  @ApiPropertyOptional({
    description:
      'Depth interval in meters between SPT tests (typical 1.5, 3 or 5)',
    example: 1.5,
    minimum: 0.5,
    maximum: 10,
  })
  @IsOptional()
  @IsNumber()
  @Min(0.5)
  @Max(10)
  sptIntervalM?: number;
}
