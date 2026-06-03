import {
  IsEnum,
  IsOptional,
  IsString,
} from 'class-validator';

import { SampleType } from '@prisma/client';
export class CreateSampleDto {
  @IsString()
  sampleNumber: string;

  @IsEnum(SampleType)
  sampleType: SampleType;

  @IsString()
  sampleDepth: string;

  @IsOptional()
  @IsString()
  remarks?: string;
}