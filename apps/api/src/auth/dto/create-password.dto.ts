import { ApiProperty } from '@nestjs/swagger';
import { IsString } from 'class-validator';

export class CreatePasswordDto {
  @ApiProperty({
    description: 'The mobile number of the user activating their account',
    example: '9876543210',
  })
  @IsString()
  mobile: string;

  @ApiProperty({
    description: 'The new password chosen by the user',
    example: 'NewP@ssw0rd123',
  })
  @IsString()
  password: string;
}
