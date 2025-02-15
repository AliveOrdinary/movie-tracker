// src/modules/lists/dto/update-list-item.input.ts
import { InputType, Field, ID } from '@nestjs/graphql';
import { IsUUID, IsNumber, Min } from 'class-validator';

@InputType()
export class UpdateListItemInput {
  @Field(() => ID)
  @IsUUID()
  listId: string;

  @Field(() => ID)
  @IsUUID()
  itemId: string;

  @Field(() => Number)
  @IsNumber()
  @Min(0)
  order: number;
}