// src/modules/lists/dto/update-collaborator.input.ts
import { InputType, Field, ID } from '@nestjs/graphql';
import { IsUUID, IsArray } from 'class-validator';
import { CollaboratorPermission } from 'src/common/enums';

@InputType()
export class UpdateCollaboratorInput {
  @Field(() => ID)
  @IsUUID()
  listId: string;

  @Field(() => ID)
  @IsUUID()
  collaboratorId: string;

  @Field(() => [CollaboratorPermission])
  @IsArray()
  permissions: CollaboratorPermission[];
}