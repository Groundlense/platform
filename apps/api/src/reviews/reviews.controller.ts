import {
  Body,
  Controller,
  Get,
  Param,
  Patch,
  Post,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { PermissionsGuard } from '../auth/guards/permissions.guard';
import { Permissions } from '../auth/decorators/permissions.decorator';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { ReviewsService } from './reviews.service';
import { CreateReviewDto } from './dto/create-review.dto';
import { CreateThreadDto } from './dto/create-thread.dto';
import { CreateMessageDto } from './dto/create-message.dto';

@ApiTags('Reviews')
@ApiBearerAuth()
@Controller()
@UseGuards(JwtAuthGuard, PermissionsGuard)
export class ReviewsController {
  constructor(private readonly reviewsService: ReviewsService) {}

  // ==========================================
  // ENGINEER REVIEWS
  // ==========================================

  @ApiOperation({
    summary:
      'Review an interval: approve / reject boring data, or modify the N-value with IS-code justification',
  })
  @Permissions('REVIEW_CREATE')
  @Post('intervals/:intervalId/reviews')
  createIntervalReview(
    @Param('intervalId') intervalId: string,
    @Body() dto: CreateReviewDto,
    @CurrentUser() user: any,
  ) {
    return this.reviewsService.createIntervalReview(user, intervalId, dto);
  }

  @ApiOperation({
    summary: 'List all engineer reviews for a borehole',
  })
  @Permissions('REVIEW_VIEW')
  @Get('boreholes/:boreholeId/reviews')
  findReviewsByBorehole(
    @Param('boreholeId') boreholeId: string,
    @CurrentUser() user: any,
  ) {
    return this.reviewsService.findReviewsByBorehole(user, boreholeId);
  }

  @ApiOperation({
    summary: 'List engineer reviews for a single interval',
  })
  @Permissions('REVIEW_VIEW')
  @Get('intervals/:intervalId/reviews')
  findReviewsByInterval(
    @Param('intervalId') intervalId: string,
    @CurrentUser() user: any,
  ) {
    return this.reviewsService.findReviewsByInterval(user, intervalId);
  }

  // ==========================================
  // FIELD QUERY THREADS
  // ==========================================

  // Static path registered before threads/:threadId param routes.
  @ApiOperation({
    summary:
      'Query inbox for the mobile field worker: threads assigned to me or on my boreholes/teams',
  })
  @Get('threads/assigned-to-me')
  findThreadsAssignedToMe(@CurrentUser() user: any) {
    return this.reviewsService.findThreadsAssignedToMe(user);
  }

  @ApiOperation({
    summary: 'Raise a query thread to the field worker on a borehole',
  })
  @Permissions('REVIEW_CREATE')
  @Post('boreholes/:boreholeId/threads')
  createThread(
    @Param('boreholeId') boreholeId: string,
    @Body() dto: CreateThreadDto,
    @CurrentUser() user: any,
  ) {
    return this.reviewsService.createThread(user, boreholeId, dto);
  }

  @ApiOperation({
    summary: 'List query threads (with messages) for a borehole',
  })
  @Permissions('BOREHOLE_VIEW')
  @Get('boreholes/:boreholeId/threads')
  findThreadsByBorehole(
    @Param('boreholeId') boreholeId: string,
    @CurrentUser() user: any,
  ) {
    return this.reviewsService.findThreadsByBorehole(user, boreholeId);
  }

  @ApiOperation({
    summary:
      'Reply to a query thread (reviewers with REVIEW_CREATE, or the assigned field worker)',
  })
  @Post('threads/:threadId/messages')
  addMessage(
    @Param('threadId') threadId: string,
    @Body() dto: CreateMessageDto,
    @CurrentUser() user: any,
  ) {
    return this.reviewsService.addMessage(user, threadId, dto);
  }

  @ApiOperation({ summary: 'Close a resolved query thread' })
  @Permissions('REVIEW_CREATE')
  @Patch('threads/:threadId/close')
  closeThread(
    @Param('threadId') threadId: string,
    @CurrentUser() user: any,
  ) {
    return this.reviewsService.closeThread(user, threadId);
  }
}
