import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsNumber, IsNotEmpty, IsString, IsOptional } from 'class-validator';

export class EndBoringSessionDto {
  @ApiProperty({ description: 'End depth of the session in meters' })
  @IsNumber()
  @IsNotEmpty()
  endDepth: number;

  @ApiProperty({ description: 'Final status of the shift session' })
  @IsString()
  @IsNotEmpty()
  status: string;

  @ApiPropertyOptional({
    description: 'Reason for terminating the boring shift early',
  })
  @IsString()
  @IsOptional()
  terminationReason?: string;
}
