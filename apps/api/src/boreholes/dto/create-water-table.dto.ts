import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsDateString, IsNumber, IsOptional, IsString } from 'class-validator';

export class CreateWaterTableDto {
  @ApiProperty({
    description:
      'Depth at which the water table was encountered, in meters below ground level',
    example: 6.2,
  })
  @IsNumber()
  depth: number;

  @ApiProperty({
    description: 'ISO 8601 date-time when the water level was observed',
    example: '2026-06-12T08:30:00.000Z',
  })
  @IsDateString()
  observedAt: string;

  @ApiPropertyOptional({
    description:
      'Additional remarks about the observation (e.g. measured 24 hours after boring, seepage)',
    example: 'Stabilized reading taken 24 hours after completion of boring',
  })
  @IsOptional()
  @IsString()
  remarks?: string;
}
