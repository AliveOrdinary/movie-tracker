//src/modules/admin/dto/resolve-report.input.ts
import { InputType, Field } from '@nestjs/graphql';
import { IsUUID, IsString, IsEnum, IsOptional } from 'class-validator';

export enum ReportResolution {
  DELETE = 'DELETE',
  WARNING = 'WARNING',
  DISMISS = 'DISMISS'
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
  notes?: string;
}