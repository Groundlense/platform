import { ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsOptional,
  IsString,
} from 'class-validator';

export class AssignBoreholeDto {
  @ApiPropertyOptional({
    description: 'ID of the site to assign the borehole to',
    example: 'b3c1a2d4-5e6f-4a7b-8c9d-0e1f2a3b4c5d',
  })
  @IsOptional()
  @IsString()
  siteId?: string;

  @ApiPropertyOptional({
    description: 'ID of the drilling/logging team to assign the borehole to',
    example: 'f6e5d4c3-b2a1-4b3c-9d8e-7f6a5b4c3d2e',
  })
  @IsOptional()
  @IsString()
  teamId?: string;
}
