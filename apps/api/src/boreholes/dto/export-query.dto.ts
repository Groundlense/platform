import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsIn, IsOptional } from 'class-validator';

export class ExportBoreholeQueryDto {
  @ApiPropertyOptional({
    enum: ['json', 'csv'],
    default: 'json',
    description: 'Export format',
  })
  @IsOptional()
  @IsIn(['json', 'csv'])
  format?: 'json' | 'csv' = 'json';
}

export class ExportProjectQueryDto {
  @ApiPropertyOptional({
    enum: ['json'],
    default: 'json',
    description: 'Export format (project export is JSON only)',
  })
  @IsOptional()
  @IsIn(['json'])
  format?: 'json' = 'json';
}
