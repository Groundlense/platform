import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsInt, IsOptional, IsString } from 'class-validator';

export class UpdateIntervalDto {
  @ApiPropertyOptional({
    description:
      'Visual soil/rock description for the depth interval (per IS 1498 classification)',
    example: 'Silty clay of medium plasticity (CI), stiff, brownish grey',
  })
  @IsOptional()
  @IsString()
  soilDescription?: string;

  @ApiPropertyOptional({
    description:
      'SPT N-value for the interval — sum of blow counts for the last 300 mm of penetration (IS 2131)',
    example: 18,
  })
  @IsOptional()
  @IsInt()
  nValue?: number;

  @ApiPropertyOptional({
    description:
      'Additional remarks for the interval (e.g. refusal, wash boring, casing depth)',
    example: 'Refusal at 50 blows for 8 cm penetration',
  })
  @IsOptional()
  @IsString()
  remarks?: string;
}
