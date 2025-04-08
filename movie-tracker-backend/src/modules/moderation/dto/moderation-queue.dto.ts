// src/modules/moderation/dto/moderation-queue.dto.ts
import { InputType, Field, ID, Int, ObjectType, registerEnumType } from '@nestjs/graphql';
import { IsEnum, IsUUID, IsString, IsOptional, IsInt, Min, IsBoolean, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';
import { ContentType, ModerationStatus, ModerationPriority, ModerationQueue } from '../entities/moderation-queue.entity';

// Export the enum values as constants rather than trying to use them as GraphQL enums
export const SortFieldValues = {
  PRIORITY: 'priority',
  CREATED_AT: 'createdAt',
  UPDATED_AT: 'updatedAt',
  STATUS: 'status',
  CONTENT_TYPE: 'contentType'
};

export const SortDirectionValues = {
  ASC: 'ASC',
  DESC: 'DESC'
};

@InputType()
export class CreateModerationQueueItemInput {
  @Field(() => ContentType)
  @IsEnum(ContentType)
  contentType: ContentType;

  @Field()
  @IsUUID()
  contentId: string;

  @Field(() => ModerationPriority, { nullable: true })
  @IsEnum(ModerationPriority)
  @IsOptional()
  priority?: ModerationPriority;

  @Field({ nullable: true })
  @IsString()
  @IsOptional()
  moderationNotes?: string;

  @Field(() => Boolean, { nullable: true })
  @IsBoolean()
  @IsOptional()
  isAutoFlagged?: boolean;

  @Field(() => String, { nullable: true })
  @IsOptional()
  metadata?: Record<string, any>;
}

@InputType()
export class UpdateModerationQueueItemInput {
  @Field()
  @IsUUID()
  id: string;

  @Field(() => ModerationStatus, { nullable: true })
  @IsEnum(ModerationStatus)
  @IsOptional()
  status?: ModerationStatus;

  @Field(() => ModerationPriority, { nullable: true })
  @IsEnum(ModerationPriority)
  @IsOptional()
  priority?: ModerationPriority;

  @Field({ nullable: true })
  @IsUUID()
  @IsOptional()
  assignedToId?: string;

  @Field({ nullable: true })
  @IsString()
  @IsOptional()
  moderationNotes?: string;
}



@InputType()
export class ModerationQueueResponse {
  @Field(() => [ModerationQueue])
  items: ModerationQueue[];

  @Field(() => Int)
  total: number;

  @Field(() => Int)
  page: number;

  @Field(() => Int)
  limit: number;

  @Field(() => Int)
  totalPages: number;
}

@ObjectType()
export class ModerationStatistics {
  @Field(() => Int)
  pendingCount: number = 0;
  
  @Field(() => Int)
  inReviewCount: number = 0;
  
  @Field(() => Int)
  todayResolvedCount: number = 0;
  
  @Field(() => Int)
  totalResolvedCount: number = 0;
  
  @Field(() => Int)
  autoFlaggedCount: number = 0;
  
  @Field(() => Int)
  averageResolutionTimeMinutes: number = 0;
  
  // Add missing properties with mappings to existing properties
  @Field(() => Int)
  get totalItems(): number {
    return this.pendingCount + this.inReviewCount + this.totalResolvedCount;
  }
  
  @Field(() => Int)
  get totalPending(): number {
    return this.pendingCount;
  }
  
  @Field(() => Int)
  get totalInProgress(): number {
    return this.inReviewCount;
  }
  
  @Field(() => Int)
  get totalCompleted(): number {
    return this.totalResolvedCount;
  }
  
  @Field(() => Int)
  get totalRejected(): number {
    return 0; // Derive from appropriate property or add to service
  }
}




