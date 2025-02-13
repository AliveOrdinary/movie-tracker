//src/modules/moderation/moderation.resolver.tsa
import { Resolver, Query, Mutation, Args } from '@nestjs/graphql';
import { Roles } from '../../common/decorators/roles.decorator';
import { UserRole } from '../../common/enums/roles.enum';
import { Review } from '../reviews/entities/review.entity';
import { Report } from './entities/report.entity';
import { ModerationService } from './moderation.service';

@Resolver()
@Roles(UserRole.MODERATOR, UserRole.ADMIN)
export class ModerationResolver {
  constructor(private readonly moderationService: ModerationService) {}

  @Mutation(() => Review)
  async flagReview(
    @Args('reviewId') reviewId: string,
    @Args('reason') reason: string
  ): Promise<Review> {
    return this.moderationService.flagReview(reviewId, reason);
  }

  @Query(() => [Report])
  async getReportedContent(): Promise<Report[]> {
    return this.moderationService.getReportedContent();
  }

  @Mutation(() => Report)
  async resolveReport(
    @Args('reportId') reportId: string,
    @Args('action') action: string
  ): Promise<Report> {
    return this.moderationService.resolveReport(reportId, action);
  }
}