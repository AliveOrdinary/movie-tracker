// src/modules/storage/dto/file-upload.dto.ts
import { Field, InputType } from '@nestjs/graphql';
import { IsString, IsOptional } from 'class-validator';

@InputType()
export class FileUploadInput {
  @Field()
  @IsString()
  filename: string;

  @Field({ nullable: true })
  @IsString()
  @IsOptional()
  folder?: string;
}