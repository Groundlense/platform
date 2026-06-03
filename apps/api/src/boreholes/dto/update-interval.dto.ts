import {
  IsInt,
  IsOptional,
  IsString,
} from 'class-validator';

export class UpdateIntervalDto {
  @IsOptional()
  @IsString()
  soilDescription?: string;

  @IsOptional()
  @IsInt()
  nValue?: number;

  @IsOptional()
  @IsString()
  remarks?: string;
}