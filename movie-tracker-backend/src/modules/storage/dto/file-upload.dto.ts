// src/modules/storage/dto/file-upload.dto.ts
import { Field, InputType, ObjectType } from '@nestjs/graphql';
import { IsString, IsOptional, MaxLength, IsEnum, IsBoolean } from 'class-validator';
import { FileMetadata } from '../interfaces/file-metadata.interface';

/**
 * Allowed folder paths for uploads
 */
export enum UploadFolder {
  AVATARS = 'avatars',
  LISTS = 'lists',
  REVIEWS = 'reviews',
  MOVIES = 'movies',
  TEMP = 'temp',
  GENERAL = 'uploads',
}

/**
 * Input for file upload operation
 */
@InputType()
export class FileUploadInput {
  @Field()
  @IsString()
  @MaxLength(255)
  filename: string;

  @Field(() => String, { defaultValue: UploadFolder.GENERAL })
  @IsEnum(UploadFolder)
  @IsOptional()
  folder?: string;

  @Field({ defaultValue: false })
  @IsBoolean()
  @IsOptional()
  isPublic?: boolean;

  @Field({ nullable: true })
  @IsString()
  @IsOptional()
  contentType?: string;
}

/**
 * Response for file upload operation
 */
@ObjectType()
export class FileUploadResponse {
  @Field()
  url: string;

  @Field()
  path: string;

  @Field()
  filename: string;

  @Field(() => FileMetadata)
  metadata: FileMetadata;
}

/**
 * Input for deleting a file
 */
@InputType()
export class FileDeleteInput {
  @Field()
  @IsString()
  url: string;
}

/**
 * Input for generating a signed URL
 */
@InputType()
export class SignedUrlInput {
  @Field()
  @IsString()
  path: string;

  @Field({ defaultValue: 60 })
  @IsOptional()
  expirationMinutes?: number;
}