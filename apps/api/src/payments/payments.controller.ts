import {
  Body,
  Controller,
  Get,
  Param,
  Patch,
  Post,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { PermissionsGuard } from '../auth/guards/permissions.guard';
import { Permissions } from '../auth/decorators/permissions.decorator';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { PaymentsService } from './payments.service';
import { CreatePaymentDto } from './dto/create-payment.dto';
import { VerifyPaymentDto } from './dto/verify-payment.dto';

@ApiTags('Payments')
@ApiBearerAuth()
@Controller()
@UseGuards(JwtAuthGuard, PermissionsGuard)
export class PaymentsController {
  constructor(private readonly paymentsService: PaymentsService) {}

  @Permissions('PROJECT_EDIT')
  @Post('payments')
  create(@CurrentUser() user: any, @Body() dto: CreatePaymentDto) {
    return this.paymentsService.create(user, dto);
  }

  @Permissions('PROJECT_EDIT')
  @Patch('payments/:id/verify')
  verify(
    @Param('id') paymentId: string,
    @Body() dto: VerifyPaymentDto,
    @CurrentUser() user: any,
  ) {
    return this.paymentsService.verify(paymentId, dto, user);
  }

  @Permissions('PROJECT_VIEW')
  @Get('projects/:projectId/payments')
  findByProject(
    @Param('projectId') projectId: string,
    @CurrentUser() user: any,
  ) {
    return this.paymentsService.findByProject(projectId, user);
  }
}
