import {
  ApiProperty,
  ApiPropertyOptional,
} from '@nestjs/swagger';
import {
  IsDateString,
  IsNotEmpty,
  IsOptional,
  IsString,
} from 'class-validator';

export class DispatchSampleDto {
  @ApiProperty({
    description:
      'ID of the GL-verified NABL lab the sample is dispatched to',
  })
  @IsString()
  @IsNotEmpty()
  assignedLabId: string;

  @ApiPropertyOptional({
    description:
      'Date the sample was dispatched (defaults to now)',
  })
  @IsOptional()
  @IsDateString()
  dispatchDate?: string;
}
