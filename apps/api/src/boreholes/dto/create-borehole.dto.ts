import {
  IsNumberString,
  IsOptional,
  IsString,
} from 'class-validator';

export class CreateBoreholeDto {
  @IsString()
  boreholeCode: string;

  @IsOptional()
  @IsString()
  name?: string;

  @IsOptional()
  @IsNumberString()
  latitude?: string;

  @IsOptional()
  @IsNumberString()
  longitude?: string;

  @IsOptional()
  @IsNumberString()
  groundLevelRL?: string;

  @IsOptional()
  @IsNumberString()
  plannedDepth?: string;
}