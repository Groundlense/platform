import { ApiProperty } from '@nestjs/swagger';
import {
  IsEnum,
  IsInt,
  IsNotEmpty,
  IsOptional,
  IsString,
  MaxLength,
  Min,
} from 'class-validator';

export enum ReviewAction {
  APPROVE = 'APPROVE',
  REJECT = 'REJECT',
  MODIFY_N = 'MODIFY_N',
}

export class CreateReviewDto {
  @ApiProperty({
    description:
      'Review decision for the interval: APPROVE / REJECT the boring data, or MODIFY_N to correct the SPT N-value (requires nValueNew + isCodeReason)',
    enum: ReviewAction,
  })
  @IsEnum(ReviewAction)
  @IsNotEmpty()
  action: ReviewAction;

  @ApiProperty({
    description:
      'Corrected SPT N-value. Mandatory when action is MODIFY_N; ignored otherwise',
    required: false,
    example: 27,
  })
  @IsOptional()
  @IsInt()
  @Min(0)
  nValueNew?: number;

  @ApiProperty({
    description:
      'IS-code justification for the modification (e.g. "IS 2131 cl. 4.3 overburden correction"). Mandatory when action is MODIFY_N',
    required: false,
    maxLength: 255,
  })
  @IsOptional()
  @IsString()
  @MaxLength(255)
  isCodeReason?: string;

  @ApiProperty({
    description: 'Free-text reviewer comments attached to the review record',
    required: false,
  })
  @IsOptional()
  @IsString()
  comments?: string;
}
