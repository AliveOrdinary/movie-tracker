//src/modules/admin/dto/report.dto.ts
import { InputType, Field, ObjectType, ID } from '@nestjs/graphql';
import { IsUUID, IsString, IsEnum, IsOptional } from 'class-validator';
import { ReportStatus, ReportResolution } from '../entities/report.entity';

@InputType()
export class CreateReportInput {
  @Field()
  @IsUUID()
  reviewId: string;

  @Field()
  @IsString()
  reason: string;
}

@InputType()
export class ResolveReportInput {
  @Field()
  @IsUUID()
  reportId: string;

  @Field(() => ReportResolution)
  @IsEnum(ReportResolution)
  resolution: ReportResolution;

  @Field({ nullable: true })
  @IsString()
  @IsOptional()
  moderatorNotes?: string;
}

@InputType()
export class ReportFiltersInput {
  @Field(() => ReportStatus, { nullable: true })
  @IsEnum(ReportStatus)
  @IsOptional()
  status?: ReportStatus;

  @Field(() => ID, { nullable: true })
  @IsUUID()
  @IsOptional()
  reviewId?: string;

  @Field(() => ID, { nullable: true })
  @IsUUID()
  @IsOptional()
  reporterId?: string;

  @Field(() => ID, { nullable: true })
  @IsUUID()
  @IsOptional()
  moderatorId?: string;
}

@ObjectType()
export class ReportStats {
  @Field()
  totalReports: number;

  @Field()
  pendingReports: number;

  @Field()
  resolvedReports: number;

  @Field()
  dismissedReports: number;
}