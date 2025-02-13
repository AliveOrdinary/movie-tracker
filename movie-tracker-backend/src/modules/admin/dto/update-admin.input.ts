// src/modules/admin/dto/update-admin.input.ts
import { InputType, Field } from '@nestjs/graphql';
import { IsString, IsOptional, IsBoolean } from 'class-validator';

@InputType()
export class UpdateAdminInput {
  @Field()
  @IsString()
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