// src/modules/reviews/reviews.controller.ts
import { 
  Controller, 
  Get, 
  Post, 
  Body, 
  Param, 
  Query, 
  UseGuards,
  ValidationPipe,
  UsePipes
} from '@nestjs/common';
import { ReviewsService } from './reviews.service';
import { AuthGuard } from '../../auth/guards/auth.guard';
import { RolesGuard } from '../../auth/guards/roles.guard';
import { Roles } from '../../auth/decorators/roles.decorator';
import { UserRole } from 'src/common/enums';
import { CurrentUser } from '../../auth/decorators/current-user.decorator';
import { User } from '../users/entities/user.entity';
import { PaginationQueryDto } from '../../common/dto/pagination-query.dto';
import { ModerationService } from '../moderation/moderation.service';
@Controller('reviews')
export class ReviewsController {
  constructor(
    private readonly reviewsService: ReviewsService,
    private readonly moderationService: ModerationService
  ) {}

  @Get('movie/:movieId')
  @UsePipes(new ValidationPipe({ transform: true }))
  async getMovieReviews(
    @Param('movieId') movieId: string,
  ) {
    return this.reviewsService.findByMovie(movieId);
  }

  @Get('user/:userId')
  @UsePipes(new ValidationPipe({ transform: true }))
  async getUserReviews(
    @Param('userId') userId: string,
  ) {
    return this.reviewsService.findByUser(userId);
  }

  @Post(':reviewId/report')
  @UseGuards(AuthGuard)
  async reportReview(
    @Param('reviewId') reviewId: string,
    @Body('reason') reason: string,
    @CurrentUser() user: User
  ) {
    return this.moderationService.reportReview(reviewId, reason, user);
  }

  @Post(':reviewId/moderate')
  @UseGuards(AuthGuard, RolesGuard)
  @Roles(UserRole.MODERATOR, UserRole.ADMIN)
  async moderateReview(
    @Param('reviewId') reviewId: string,
    @Body('action') action: 'APPROVE' | 'REJECT' | 'FLAG',
    @Body('reason') reason: string,
    @CurrentUser() user: User
  ) {
    switch (action) {
      case 'APPROVE':
        return this.moderationService.approveReview(reviewId, user);
      case 'REJECT':
        if (!reason) throw new Error('Reason is required for rejection');
        return this.moderationService.rejectReview(reviewId, reason, user);
      case 'FLAG':
        if (!reason) throw new Error('Reason is required for flagging');
        return this.moderationService.flagReview(reviewId, reason, user);
    }
  }

  @Get('stats/movie/:movieId')
  async getMovieReviewStats(@Param('movieId') movieId: string) {
    return this.reviewsService.getMovieReviewStats(movieId);
  }

  @Get('stats/user/:userId')
  async getUserReviewStats(@Param('userId') userId: string) {
    return this.reviewsService.getUserReviewStats(userId);
  }
}