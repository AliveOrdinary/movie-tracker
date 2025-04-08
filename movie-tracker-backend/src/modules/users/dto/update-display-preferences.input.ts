//src/modules/users/dto/update-display-preferences.input.ts
import { InputType, Field } from '@nestjs/graphql';
import { IsEnum, IsOptional } from 'class-validator';
import { WatchlistDisplayMode, ActivityFeedFilter, ReviewsSortOrder } from 'src/common/enums';

@InputType()
export class UpdateDisplayPreferencesInput {
  @Field(() => WatchlistDisplayMode, { nullable: true })
  @IsOptional()
  @IsEnum(WatchlistDisplayMode)
  watchlistDisplayMode?: WatchlistDisplayMode;

  @Field(() => ActivityFeedFilter, { nullable: true })
  @IsOptional()
  @IsEnum(ActivityFeedFilter)
  activityFeedFilter?: ActivityFeedFilter;

  @Field(() => ReviewsSortOrder, { nullable: true })
  @IsOptional()
  @IsEnum(ReviewsSortOrder)
  reviewsSortOrder?: ReviewsSortOrder;
}
