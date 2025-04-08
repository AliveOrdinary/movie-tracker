// src/modules/storage/interfaces/file-metadata.interface.ts
import { Field, ObjectType, Int } from '@nestjs/graphql';

/**
 * Interface for file metadata
 */
@ObjectType()
export class FileMetadata {
  @Field()
  name: string;
  
  @Field()
  bucket: string;
  
  @Field()
  path: string;
  
  @Field()
  fullPath: string;
  
  @Field({ nullable: true })
  generation?: string;
  
  @Field({ nullable: true })
  metageneration?: string;
  
  @Field()
  contentType: string;
  
  @Field()
  timeCreated: string;
  
  @Field()
  updated: string;
  
  @Field({ nullable: true })
  storageClass?: string;
  
  @Field(() => Int)
  size: number;
  
  @Field({ nullable: true })
  md5Hash?: string;
  
  @Field({ nullable: true })
  contentEncoding?: string;
  
  @Field({ nullable: true })
  contentDisposition?: string;
  
  @Field()
  downloadUrl: string;
  
  @Field()
  publicUrl: string;
  
  @Field(() => Boolean)
  isPublic: boolean;
  
  @Field({ nullable: true })
  cacheControl?: string;
  
  @Field(() => [String], { nullable: true })
  customMetadata?: string[];
}