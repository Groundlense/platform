import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsString, IsNotEmpty, IsOptional } from 'class-validator';

export class CreateSoilDescriptionDto {
  @ApiProperty({ description: 'Type of soil' })
  @IsString()
  @IsNotEmpty()
  soilType: string;

  @ApiPropertyOptional({
    description: 'Unified Soil Classification System (USCS) code',
  })
  @IsString()
  @IsOptional()
  uscsCode?: string;

  @ApiPropertyOptional({ description: 'Color of the soil' })
  @IsString()
  @IsOptional()
  color?: string;

  @ApiPropertyOptional({ description: 'Consistency index of the soil' })
  @IsString()
  @IsOptional()
  consistency?: string;

  @ApiProperty({ description: 'Complete text description of the soil layer' })
  @IsString()
  @IsNotEmpty()
  description: string;

  @ApiPropertyOptional({ description: 'Any extra remarks' })
  @IsString()
  @IsOptional()
  remarks?: string;
}
