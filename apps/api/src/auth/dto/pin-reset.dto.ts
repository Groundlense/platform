import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString, MinLength } from 'class-validator';

/** Worker-initiated request from the app's "Forgot PIN" screen. */
export class RequestPinResetDto {
  @ApiProperty({ description: 'Mobile number of the worker account' })
  @IsString()
  @IsNotEmpty()
  mobile: string;
}

/** Admin-side: mint the WhatsApp reset link for a crew member. */
export class GeneratePinResetLinkDto {
  @ApiProperty({ description: 'User id of the crew member to reset' })
  @IsString()
  @IsNotEmpty()
  userId: string;
}

/** Public completion from the /reset-pin web page. */
export class CompletePinResetDto {
  @ApiProperty({ description: 'Single-use token from the reset link' })
  @IsString()
  @IsNotEmpty()
  token: string;

  @ApiProperty({ description: 'Mobile number of the account being reset' })
  @IsString()
  @IsNotEmpty()
  mobile: string;

  @ApiProperty({ description: 'New PIN / password (min 4 characters)' })
  @IsString()
  @MinLength(4)
  newPassword: string;
}
