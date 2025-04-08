// src/modules/movies/types/watch-providers.types.ts

import { Field, ObjectType, Int } from '@nestjs/graphql';

@ObjectType()
export class WatchProvider {
  @Field(() => Int)
  provider_id: number;

  @Field()
  provider_name: string;

  @Field()
  logo_path: string;
}

@ObjectType()
export class MovieCountryWatchProviders {
  @Field()
  link: string;

  @Field(() => [WatchProvider], { nullable: true })
  rent?: WatchProvider[];

  @Field(() => [WatchProvider], { nullable: true })
  buy?: WatchProvider[];

  @Field(() => [WatchProvider], { nullable: true })
  flatrate?: WatchProvider[];
}

@ObjectType()
export class WatchProvidersByCountry {
  @Field(() => MovieCountryWatchProviders, { nullable: true })
  US?: MovieCountryWatchProviders;
}

@ObjectType()
export class MovieWatchProviders {
  @Field(() => Int)
  id: number;

  @Field(() => WatchProvidersByCountry)
  results: WatchProvidersByCountry;
}