import { ApiProperty } from '@nestjs/swagger';
import { IsBoolean } from 'class-validator';

export class RespondProjectCompanyDto {
  @ApiProperty({
    description: 'true to accept the invitation, false to decline',
    example: true,
  })
  @IsBoolean()
  accept: boolean;
}
