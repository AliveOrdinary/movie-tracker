// src/modules/lists/dto/add-list-item.input.ts
import { InputType, Field, ID } from '@nestjs/graphql';
import { IsUUID, IsNumber, IsOptional, Min } from 'class-validator';

@InputType()
export class AddListItemInput {
  @Field(() => ID)
  @IsUUID()
  listId: string;

  @Field(() => Number)
  @IsNumber()
  movieId: number;

  @Field(() => Number, { nullable: true })
  @IsNumber()
  @IsOptional()
  @Min(0)
  order?: number;
}