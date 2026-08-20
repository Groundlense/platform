import { ApiProperty } from '@nestjs/swagger';
import { IsInt, IsNotEmpty, IsString, Min } from 'class-validator';

export class CreateOrderDto {
  @ApiProperty({
    description: 'ID of the project this payment is for',
  })
  @IsString()
  @IsNotEmpty()
  projectId: string;

  @ApiProperty({ description: 'Number of borings being purchased', minimum: 1 })
  @IsInt()
  @Min(1)
  boringsPurchased: number;
}
