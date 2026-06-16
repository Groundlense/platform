import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsNotEmpty } from 'class-validator';

export class VerifyPaymentDto {
  @ApiProperty({ description: 'Payment reference ID returned by Razorpay' })
  @IsString()
  @IsNotEmpty()
  razorpayPaymentId: string;

  @ApiProperty({
    description:
      'Razorpay checkout signature (HMAC-SHA256 of order_id|payment_id); verified server-side',
  })
  @IsString()
  @IsNotEmpty()
  razorpaySignature: string;
}
