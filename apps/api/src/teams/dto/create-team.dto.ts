import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsString } from 'class-validator';

export class CreateTeamDto {
  @ApiProperty({
    description: 'Unique team code within the organization',
    example: 'RIG-02',
  })
  @IsString()
  code: string;

  @ApiProperty({
    description: 'Team name',
    example: 'Drilling Crew B',
  })
  @IsString()
  name: string;

  @ApiPropertyOptional({
    description: 'Description of the team, its rig, or area of operation',
    example: 'Rotary rig crew handling boreholes in the northern site cluster',
  })
  @IsOptional()
  @IsString()
  description?: string;
}
