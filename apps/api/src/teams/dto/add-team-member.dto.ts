import { ApiProperty } from '@nestjs/swagger';
import { IsString } from 'class-validator';

export class AddTeamMemberDto {
  @ApiProperty({
    description: 'ID of the user to add to the team',
    example: 'c7d8e9f0-1a2b-4c3d-9e8f-7a6b5c4d3e2f',
  })
  @IsString()
  userId: string;
}
