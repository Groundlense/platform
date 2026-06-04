import { ApiProperty } from '@nestjs/swagger';
import { IsNumber, IsNotEmpty } from 'class-validator';

export class CreateBoringSessionDto {
  @ApiProperty({ description: 'Start depth of the session in meters' })
  @IsNumber()
  @IsNotEmpty()
  startDepth: number;
}
