import {
  IsString,
  Length,
} from 'class-validator';

export class ResetPinDto {
  @IsString()
  @Length(4, 4)
  pin: string;
}