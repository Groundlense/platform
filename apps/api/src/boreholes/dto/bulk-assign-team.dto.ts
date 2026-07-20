import { ApiProperty } from '@nestjs/swagger';
import { ArrayNotEmpty, IsArray, IsString } from 'class-validator';

export class BulkAssignTeamDto {
  @ApiProperty({
    description: 'Borehole IDs to assign in one call',
    type: [String],
  })
  @IsArray()
  @ArrayNotEmpty()
  @IsString({ each: true })
  boreholeIds: string[];

  @ApiProperty({ description: 'Team ID to assign the boreholes to' })
  @IsString()
  teamId: string;
}
