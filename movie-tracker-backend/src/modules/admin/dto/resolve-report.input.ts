// src/modules/admin/dto/resolve-report.input.ts
import { InputType, Field } from '@nestjs/graphql';
import { IsUUID, IsEnum, IsOptional, IsString } from 'class-validator';
import { ReportResolution } from 'src/common/enums';

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
