import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsEnum, IsOptional, IsString } from 'class-validator';

import { SampleType } from '@prisma/client';
export class CreateSampleDto {
  @ApiProperty({
    description: 'Sample identifier as recorded on the borelog',
    example: 'DS-1',
  })
  @IsString()
  sampleNumber: string;

  @ApiProperty({
    description:
      'Type of sample collected (e.g. disturbed, undisturbed, SPT split-spoon, water)',
    enum: SampleType,
  })
  @IsEnum(SampleType)
  sampleType: SampleType;

  @ApiProperty({
    description:
      'Depth at which the sample was recovered, in meters below ground level (numeric string)',
    example: '4.50',
  })
  @IsString()
  sampleDepth: string;

  @ApiPropertyOptional({
    description:
      'Additional remarks about the sample (recovery, condition, preservation)',
    example: 'UDS tube recovery 85%, sealed with wax',
  })
  @IsOptional()
  @IsString()
  remarks?: string;
}
