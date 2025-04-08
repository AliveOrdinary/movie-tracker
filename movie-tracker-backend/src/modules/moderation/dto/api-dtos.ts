// src/modules/moderation/dto/api-dtos.ts
import { IsString, IsNotEmpty, IsEnum, IsUUID, IsOptional, ValidateNested, IsInt, Min, Max } from 'class-validator';
import { Type } from 'class-transformer';
import { ContentType } from '../entities/moderation-queue.entity';
import { ReportResolution } from '../../../common/enums';

/**
 * DTO for creating a new report
 */
export class CreateReportDto {
  @IsEnum(ContentType)
  @IsNotEmpty()
  contentType: ContentType;

  @IsString()
  @IsNotEmpty()
  contentId: string;

  @IsString()
  @IsNotEmpty()
  reason: string;
}

/**
 * DTO for resolving a report
 */
export class ResolveReportDto {
  @IsEnum(ReportResolution)
  @IsNotEmpty()
  resolution: ReportResolution;

  @IsString()
  @IsOptional()
  notes?: string;
}

/**
 * DTO for moderating content (approval/rejection/flagging)
 */
export class ModerateContentDto {
  @IsString()
  @IsOptional()
  reason?: string;
}

/**
 * DTO for pagination queries
 */
export class PaginationQueryDto {
  @IsInt()
  @Min(1)
  @IsOptional()
  page?: number = 1;

  @IsInt()
  @Min(1)
  @Max(100)
  @IsOptional()
  limit?: number = 10;
}

/**
 * DTO for assigning moderation queue items
 */
export class AssignQueueItemDto {
  @IsUUID()
  @IsOptional()
  moderatorId?: string;
}

/**
 * DTO for content moderation action with notes
 */
export class ModerationActionDto {
  @IsUUID()
  @IsNotEmpty()
  contentId: string;

  @IsString()
  @IsNotEmpty()
  reason: string;
}

/**
 * Response DTO for flagged/reported content stats
 */
export class ModerationStatsResponseDto {
  pendingReports: number;
  resolvedReports: number;
  flaggedReviews: number;
  flaggedLists: number;
  moderationQueueItems: number;
  autoFlaggedContent: number;
}

/**
 * Response DTO for queue statistics
 */
export class QueueStatisticsResponseDto {
  pendingCount: number;
  inReviewCount: number;
  todayResolvedCount: number;
  totalResolvedCount: number;
  autoFlaggedCount: number;
  averageResolutionTimeMinutes: number;
}