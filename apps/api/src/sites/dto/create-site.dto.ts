import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsOptional,
  IsString,
} from 'class-validator';

export class CreateSiteDto {
  @ApiProperty({
    description: 'Unique site code within the project',
    example: 'SITE-A',
  })
  @IsString()
  code: string;

  @ApiProperty({
    description: 'Site name or location label',
    example: 'North Embankment',
  })
  @IsString()
  name: string;

  @ApiPropertyOptional({
    description: 'Description of the site, access conditions, or terrain',
    example: 'Low-lying area near river bank; access via service road only',
  })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiPropertyOptional({
    description: 'Latitude of the site centroid in decimal degrees (WGS84), as a numeric string',
    example: '28.613939',
  })
  @IsOptional()
  @IsString()
  latitude?: string;

  @ApiPropertyOptional({
    description: 'Longitude of the site centroid in decimal degrees (WGS84), as a numeric string',
    example: '77.209021',
  })
  @IsOptional()
  @IsString()
  longitude?: string;
}
