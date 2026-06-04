import {
  IsDateString,
  IsNumber,
  IsOptional,
  IsString,
} from 'class-validator';

export class CreateWaterTableDto {
  @IsNumber()
  depth: number;

  @IsDateString()
  observedAt: string;

  @IsOptional()
  @IsString()
  remarks?: string;
}