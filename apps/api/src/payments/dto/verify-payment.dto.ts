import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsNotEmpty, IsEnum } from 'class-validator';
import { PaymentStatus } from '@prisma/client';

export class VerifyPaymentDto {
  @ApiProperty({ description: 'Payment reference ID returned by Razorpay' })
  @IsString()
  @IsNotEmpty()
  razorpayPaymentId: string;

  @ApiProperty({ description: 'Payment verification status', enum: PaymentStatus })
  @IsEnum(PaymentStatus)
  @IsNotEmpty()
  status: PaymentStatus;
}
