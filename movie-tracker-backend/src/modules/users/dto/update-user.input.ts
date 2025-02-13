//src/modules/users/dto/update-user.input.ts
import { InputType, Field, PartialType } from '@nestjs/graphql';
import { CreateUserInput } from './create-user.input';

@InputType()
export class UpdateUserInput extends PartialType(CreateUserInput) {
  @Field(() => String, { nullable: true })
  bio?: string;

  @Field(() => String, { nullable: true })
  location?: string;

  @Field(() => String, { nullable: true })
  website?: string;

  @Field(() => [String], { nullable: true })
  favoriteGenres?: string[];

  @Field(() => Boolean, { nullable: true })
  showOnlineStatus?: boolean;

  @Field(() => Boolean, { nullable: true })
  showActivity?: boolean;

  @Field(() => Boolean, { nullable: true })
  allowFriendRequests?: boolean;

  @Field(() => Boolean, { nullable: true })
  showWatchlist?: boolean;
}