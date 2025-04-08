// src/modules/admin/dto/system-config.dto.ts
import { InputType, ObjectType, Field, Int } from '@nestjs/graphql';
import { IsString, IsNotEmpty, IsOptional, MaxLength, IsBoolean, IsEnum, IsInt, Min } from 'class-validator';
import { SystemConfig, ConfigCategory, ConfigDataType } from '../entities/system-config.entity';

@InputType()
export class CreateSystemConfigInput {
  @Field()
  @IsString()
  @IsNotEmpty()
  @MaxLength(100)
  key: string;

  @Field()
  @IsString()
  @IsNotEmpty()
  value: string;

  @Field(() => ConfigCategory)
  @IsEnum(ConfigCategory)
  category: ConfigCategory;

  @Field({ nullable: true })
  @IsString()
  @IsOptional()
  @MaxLength(255)
  description?: string;
  
  @Field(() => Boolean, { defaultValue: false })
  @IsBoolean()
  @IsOptional()
  isEncrypted?: boolean;
  
  @Field(() => Boolean, { defaultValue: false })
  @IsBoolean()
  @IsOptional()
  isSystem?: boolean;
  
  @Field(() => ConfigDataType, { nullable: true })
  @IsEnum(ConfigDataType)
  @IsOptional()
  dataType?: ConfigDataType;
}

@InputType()
export class UpdateSystemConfigInput {
  @Field()
  @IsString()
  @IsNotEmpty()
  key: string;

  @Field()
  @IsString()
  @IsNotEmpty()
  value: string;

  @Field(() => ConfigCategory, { nullable: true })
  @IsEnum(ConfigCategory)
  @IsOptional()
  category?: ConfigCategory;

  @Field({ nullable: true })
  @IsString()
  @IsOptional()
  @MaxLength(255)
  description?: string;
}

@InputType()
export class SystemConfigFiltersInput {
  @Field(() => ConfigCategory, { nullable: true })
  @IsEnum(ConfigCategory)
  @IsOptional()
  category?: ConfigCategory;
  
  @Field(() => Boolean, { nullable: true })
  @IsBoolean()
  @IsOptional()
  isSystem?: boolean;
  
  @Field({ nullable: true })
  @IsString()
  @IsOptional()
  searchTerm?: string;
  
  @Field(() => Int, { nullable: true, defaultValue: 1 })
  @IsInt()
  @Min(1)
  @IsOptional()
  page?: number;
  
  @Field(() => Int, { nullable: true, defaultValue: 20 })
  @IsInt()
  @Min(1)
  @IsOptional()
  limit?: number;
}

@ObjectType()
export class PaginatedSystemConfigs {
  @Field(() => [SystemConfig])
  items: SystemConfig[];
  
  @Field(() => Int)
  total: number;
  
  @Field(() => Int)
  page: number;
  
  @Field(() => Int)
  totalPages: number;
}
