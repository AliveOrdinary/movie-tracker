//src/modules/admin/dto/update-moderation-log.input.ts
import { InputType, Field } from '@nestjs/graphql';
import { IsUUID, IsString, IsOptional, IsBoolean } from 'class-validator';

@InputType()
export class UpdateModerationLogInput {
  @Field()
  @IsUUID()
  id: string;

  @Field({ nullable: true })
  @IsString()
  @IsOptional()
  notes?: string;

  @Field({ nullable: true })
  @IsBoolean()
  @IsOptional()
  isResolved?: boolean;
}