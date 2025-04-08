// src/modules/lists/dto/add-list-item.input.ts
import { InputType, Field, ID, Int } from '@nestjs/graphql';
import { IsUUID, IsNumber, IsOptional, Min } from 'class-validator';

@InputType()
export class AddListItemInput {
  @Field(() => ID)
  @IsUUID()
  listId: string;

  @Field(() => Int)
  @IsNumber()
  tmdbId: number; // We're using TMDB ID (number) for input, but will resolve to internal UUID in the service

  @Field(() => Number, { nullable: true })
  @IsNumber()
  @IsOptional()
  @Min(0)
  order?: number;
}