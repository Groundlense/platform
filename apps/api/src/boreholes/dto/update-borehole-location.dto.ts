import { ApiProperty } from '@nestjs/swagger';
import { IsNumberString } from 'class-validator';

/**
 * Corrects a borehole's coordinates in place — for fixing data uploaded
 * before the UTM zone picker existed (raw UTM digits stored as-is, since
 * the app never guesses a zone). The web client converts UTM to decimal
 * degrees itself (using the zone/hemisphere the user explicitly states) and
 * sends the already-converted decimal-degree values here; the server only
 * validates they're in range, it doesn't do any UTM interpretation.
 */
export class UpdateBoreholeLocationDto {
  @ApiProperty({ description: 'Corrected latitude, decimal degrees', example: '12.9716000' })
  @IsNumberString()
  latitude: string;

  @ApiProperty({ description: 'Corrected longitude, decimal degrees', example: '77.5946000' })
  @IsNumberString()
  longitude: string;
}
