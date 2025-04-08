// src/modules/lists/dto/add-collaborator.input.ts
import { InputType, Field, ID } from '@nestjs/graphql';
import { IsUUID, IsArray } from 'class-validator';
import { CollaboratorPermission } from 'src/common/enums';

@InputType()
export class AddCollaboratorInput {
  @Field(() => ID)
  @IsUUID()
  listId: string;

  @Field(() => ID)
  @IsUUID()
  userId: string;

  @Field(() => [CollaboratorPermission])
  @IsArray()
  permissions: CollaboratorPermission[];
}