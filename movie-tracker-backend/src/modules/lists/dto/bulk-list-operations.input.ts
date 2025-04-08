// src/modules/lists/dto/bulk-list-operations.input.ts
import { InputType, Field } from '@nestjs/graphql';
import { IsArray, IsNotEmpty, IsNumber, IsString } from 'class-validator';

@InputType()
export class BulkMovieAddInput {
  @Field()
  @IsString()
  @IsNotEmpty()
  listId: string;

  @Field(() => [Number])
  @IsArray()
  @IsNumber({}, { each: true })
  tmdbIds: number[]; // Using TMDB IDs (numbers) as input, not internal UUIDs
}

@InputType()
export class BulkMovieRemoveInput {
  @Field()
  @IsString()
  @IsNotEmpty()
  listId: string;

  @Field(() => [Number])
  @IsArray()
  @IsNumber({}, { each: true })
  tmdbIds: number[]; // Using TMDB IDs (numbers) for input, will resolve to internal UUIDs in service
}

@InputType()
export class BulkListItemReorderInput {
  @Field()
  @IsString()
  @IsNotEmpty()
  listId: string;

  @Field(() => [String])
  @IsArray()
  @IsString({ each: true })
  itemIds: string[];
}
