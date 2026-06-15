import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString } from 'class-validator';

export class CreateMessageDto {
  @ApiProperty({
    description: 'Reply message body to append to the query thread',
  })
  @IsString()
  @IsNotEmpty()
  message: string;
}
