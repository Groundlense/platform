import { ApiProperty } from '@nestjs/swagger';
import { IsIn, IsNotEmpty, IsOptional, IsString } from 'class-validator';

export class BulkReviewDto {
  @ApiProperty({
    description:
      'APPROVE or REJECT every interval of the borehole in one call',
    enum: ['APPROVE', 'REJECT'],
  })
  @IsIn(['APPROVE', 'REJECT'])
  @IsNotEmpty()
  action: 'APPROVE' | 'REJECT';

  @ApiProperty({
    description: 'Free-text reviewer comments attached to every review record',
    required: false,
  })
  @IsOptional()
  @IsString()
  comments?: string;
}
