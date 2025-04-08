// src/modules/admin/dto/audit-log.dto.ts
import { InputType, ObjectType, Field, Int } from '@nestjs/graphql';
import { AdminActionType } from '../entities/admin-audit-log.entity';
import { AdminAuditLog } from '../entities/admin-audit-log.entity';

@InputType()
export class CreateAuditLogInput {
  @Field(() => AdminActionType)
  actionType: AdminActionType;

  @Field()
  action: string;

  @Field(() => String, { nullable: true })
  targetUserId?: string;

  @Field(() => String, { nullable: true })
  metadata?: string; // JSON string
}

@InputType()
export class AuditLogFiltersInput {
  @Field(() => AdminActionType, { nullable: true })
  actionType?: AdminActionType;

  @Field(() => String, { nullable: true })
  adminId?: string;

  @Field(() => String, { nullable: true })
  targetUserId?: string;

  @Field(() => Date, { nullable: true })
  startDate?: Date;

  @Field(() => Date, { nullable: true })
  endDate?: Date;

  @Field(() => Int, { nullable: true, defaultValue: 1 })
  page?: number;

  @Field(() => Int, { nullable: true, defaultValue: 10 })
  limit?: number;
}

@ObjectType()
export class PaginatedAuditLogs {
  @Field(() => [AdminAuditLog])
  items: AdminAuditLog[];

  @Field(() => Int)
  total: number;

  @Field(() => Int)
  page: number;

  @Field(() => Int)
  totalPages: number;
}
