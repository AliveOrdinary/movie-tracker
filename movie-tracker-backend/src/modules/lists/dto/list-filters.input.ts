// src/modules/lists/dto/list-filters.input.ts
import { InputType, Field, Int } from '@nestjs/graphql';
import { ListPrivacy, ListType } from 'src/common/enums';
import { IsString, IsEnum, IsOptional, IsInt, Min, Max, IsBoolean } from 'class-validator';

@InputType()
export class ListFiltersInput {
  @Field({ nullable: true })
  @IsString()
  @IsOptional()
  searchTerm?: string;

  @Field(() => ListType, { nullable: true })
  @IsEnum(ListType)
  @IsOptional()
  type?: ListType;

  @Field(() => ListPrivacy, { nullable: true })
  @IsEnum(ListPrivacy)
  @IsOptional()
  privacy?: ListPrivacy;

  @Field({ nullable: true })
  @IsString()
  @IsOptional()
  category?: string;

  @Field(() => Int, { nullable: true })
  @IsInt()
  @IsOptional()
  @Min(1)
  page?: number = 1;

  @Field(() => Int, { nullable: true })
  @IsInt()
  @IsOptional()
  @Min(1)
  @Max(50)
  limit?: number = 10;

  @Field({ nullable: true })
  @IsString()
  @IsOptional()
  sortBy?: 'createdAt' | 'updatedAt' | 'favoriteCount' | 'itemCount' | 'name';

  @Field({ nullable: true })
  @IsString()
  @IsOptional()
  sortDirection?: 'ASC' | 'DESC' = 'DESC';

  @Field({ nullable: true })
  @IsBoolean()
  @IsOptional()
  includeCollaborative?: boolean = false;

  @Field({ nullable: true })
  @IsBoolean()
  @IsOptional()
  onlyFavorites?: boolean = false;
}