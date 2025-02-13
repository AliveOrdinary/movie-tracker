//src/modules/movies/types/tmdb-graphql.types.ts
import { ObjectType, Field, Int } from '@nestjs/graphql';

@ObjectType()
export class TMDBCredits {
  @Field(() => [CastMember])
  cast: CastMember[];

  @Field(() => [CrewMember])
  crew: CrewMember[];
}

@ObjectType()
class CastMember {
  @Field(() => Int)
  id: number;

  @Field()
  name: string;

  @Field()
  character: string;

  @Field({ nullable: true })
  profilePath?: string;

  @Field(() => Int)
  order: number;
}

@ObjectType()
class CrewMember {
  @Field(() => Int)
  id: number;

  @Field()
  name: string;

  @Field()
  job: string;

  @Field()
  department: string;

  @Field({ nullable: true })
  profilePath?: string;
}

@ObjectType()
export class TMDBVideo {
  @Field()
  id: string;

  @Field()
  key: string;

  @Field()
  name: string;

  @Field()
  site: string;

  @Field(() => Int)
  size: number;

  @Field()
  type: string;
}