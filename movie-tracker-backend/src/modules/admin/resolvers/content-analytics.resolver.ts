// src/modules/admin/resolvers/content-analytics.resolver.ts
import { Resolver, Query, Args, Int, ObjectType, Field } from '@nestjs/graphql';
import { UseGuards, Logger } from '@nestjs/common';
import { AuthGuard } from '../../../auth/guards/auth.guard';
import { RolesGuard } from '../../../auth/guards/roles.guard';
import { Roles } from '../../../auth/decorators/roles.decorator';
import { UserRole } from '../../../common/enums';
import { ContentAnalyticsService } from '../services/content-analytics.service';
import { TimeSeriesData } from '../dto/time-series.dto';
import { GenreAnalytics } from '../dto/admin-content-stats.dto';

@ObjectType()
class PopularContentItem {
  @Field(() => String)
  id: string;
  
  @Field(() => String)
  title: string;
  
  @Field(() => Int)
  count: number;
  
  @Field(() => String, { nullable: true })
  type?: string;
}

@ObjectType()
class PopularContentAnalytics {
  @Field(() => [PopularContentItem])
  movies: PopularContentItem[];
  
  @Field(() => [PopularContentItem])
  lists: PopularContentItem[];
  
  @Field(() => [PopularContentItem])
  reviews: PopularContentItem[];
}

@Resolver()
@UseGuards(AuthGuard, RolesGuard)
@Roles(UserRole.ADMIN)
export class ContentAnalyticsResolver {
  private readonly logger = new Logger(ContentAnalyticsResolver.name);

  constructor(private readonly contentAnalyticsService: ContentAnalyticsService) {}

  @Query(() => TimeSeriesData)
  async userRegistrationTrends(
    @Args('timeframe', { defaultValue: 'day' }) timeframe: 'day' | 'week' | 'month',
    @Args('period', { type: () => Int, defaultValue: 30 }) period: number,
  ): Promise<TimeSeriesData> {
    this.logger.log(`Fetching user registration trends for ${timeframe} over ${period} periods`);
    return this.contentAnalyticsService.getUserRegistrationTrends(timeframe, period);
  }

  @Query(() => TimeSeriesData)
  async reviewTrends(
    @Args('timeframe', { defaultValue: 'day' }) timeframe: 'day' | 'week' | 'month',
    @Args('period', { type: () => Int, defaultValue: 30 }) period: number,
  ): Promise<TimeSeriesData> {
    this.logger.log(`Fetching review trends for ${timeframe} over ${period} periods`);
    return this.contentAnalyticsService.getReviewTrends(timeframe, period);
  }

  @Query(() => TimeSeriesData)
  async watchActivityTrends(
    @Args('timeframe', { defaultValue: 'day' }) timeframe: 'day' | 'week' | 'month',
    @Args('period', { type: () => Int, defaultValue: 30 }) period: number,
  ): Promise<TimeSeriesData> {
    this.logger.log(`Fetching watch activity trends for ${timeframe} over ${period} periods`);
    return this.contentAnalyticsService.getWatchActivityTrends(timeframe, period);
  }

  @Query(() => [GenreAnalytics])
  async genreAnalytics(): Promise<GenreAnalytics[]> {
    this.logger.log('Fetching genre analytics');
    return this.contentAnalyticsService.getGenreAnalytics();
  }

  @Query(() => TimeSeriesData)
  async listCreationStats(): Promise<TimeSeriesData> {
    this.logger.log('Fetching list creation statistics');
    return this.contentAnalyticsService.getListCreationStats();
  }

  @Query(() => PopularContentAnalytics)
  async popularContentAnalytics(
    @Args('limit', { type: () => Int, defaultValue: 10 }) limit: number,
  ): Promise<PopularContentAnalytics> {
    this.logger.log(`Fetching popular content analytics with limit ${limit}`);
    return this.contentAnalyticsService.getPopularContentAnalytics(limit);
  }
}
