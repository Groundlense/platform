import {
  IsOptional,
  IsString,
} from 'class-validator';

export class AssignBoreholeDto {
  @IsOptional()
  @IsString()
  siteId?: string;

  @IsOptional()
  @IsString()
  teamId?: string;
}