import { ApiProperty } from '@nestjs/swagger';
import {
  IsEnum,
  IsIn,
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
  MODIFY_FIELD = 'MODIFY_FIELD',
}

/** SPT interval fields the Review tab lets an engineer correct. */
export const EDITABLE_INTERVAL_FIELDS = [
  'fromDepth',
  'toDepth',
  'blow1',
  'blow2',
  'blow3',
  'nValue',
  'nCorrected',
  'soilDescription',
] as const;

export type EditableIntervalField = (typeof EDITABLE_INTERVAL_FIELDS)[number];

export class CreateReviewDto {
  @ApiProperty({
    description:
      'Review decision for the interval: APPROVE / REJECT the boring data, MODIFY_N to correct the SPT N-value (legacy — requires nValueNew + isCodeReason), or MODIFY_FIELD to correct any editable interval field (requires fieldName + fieldValueNew + isCodeReason)',
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
      'Interval field being corrected. Mandatory when action is MODIFY_FIELD',
    required: false,
    enum: EDITABLE_INTERVAL_FIELDS,
  })
  @IsOptional()
  @IsIn(EDITABLE_INTERVAL_FIELDS as unknown as string[])
  fieldName?: EditableIntervalField;

  @ApiProperty({
    description:
      'New value for fieldName, as a string (parsed per field server-side — numeric for all fields except soilDescription). Mandatory when action is MODIFY_FIELD',
    required: false,
    example: '7.5',
  })
  @IsOptional()
  @IsString()
  fieldValueNew?: string;

  @ApiProperty({
    description:
      'IS-code justification for the modification (e.g. "IS 2131 cl. 4.3 overburden correction"). Mandatory when action is MODIFY_N or MODIFY_FIELD',
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
