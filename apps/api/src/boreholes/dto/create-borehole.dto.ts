import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsNumberString, IsOptional, IsString } from 'class-validator';

export class CreateBoreholeDto {
  @ApiProperty({
    description:
      'Unique borehole code within the project (as marked on the borelog)',
    example: 'BH-01',
  })
  @IsString()
  boreholeCode: string;

  @ApiPropertyOptional({
    description: 'Human-readable name or location label for the borehole',
    example: 'Bridge Abutment A1',
  })
  @IsOptional()
  @IsString()
  name?: string;

  @ApiPropertyOptional({
    description:
      'Latitude of the borehole location in decimal degrees (WGS84), as a numeric string',
    example: '28.613939',
  })
  @IsOptional()
  @IsNumberString()
  latitude?: string;

  @ApiPropertyOptional({
    description:
      'Longitude of the borehole location in decimal degrees (WGS84), as a numeric string',
    example: '77.209021',
  })
  @IsOptional()
  @IsNumberString()
  longitude?: string;

  @ApiPropertyOptional({
    description:
      'Ground level reduced level (RL) at the borehole collar in meters, as a numeric string',
    example: '212.45',
  })
  @IsOptional()
  @IsNumberString()
  groundLevelRL?: string;

  @ApiPropertyOptional({
    description:
      'Planned termination depth of the borehole in meters below ground level, as a numeric string',
    example: '30.0',
  })
  @IsOptional()
  @IsNumberString()
  plannedDepth?: string;

  @ApiPropertyOptional({
    description: 'Structure type of the boring location',
    example: 'VUP',
  })
  @IsOptional()
  @IsString()
  structureType?: string;

  @ApiPropertyOptional({
    description: 'Chainage of the boring location',
    example: '134+550',
  })
  @IsOptional()
  @IsString()
  chainage?: string;

  @ApiPropertyOptional({
    description: 'Span details of the structure',
    example: '1x20',
  })
  @IsOptional()
  @IsString()
  span?: string;
}
