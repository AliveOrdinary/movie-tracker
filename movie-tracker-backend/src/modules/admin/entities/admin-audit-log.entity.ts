// src/modules/admin/entities/admin-audit-log.entity.ts
import { Entity, Column, PrimaryGeneratedColumn, ManyToOne, JoinColumn, CreateDateColumn } from 'typeorm';
import { ObjectType, Field, ID, registerEnumType } from '@nestjs/graphql';
import { User } from '../../users/entities/user.entity';

export enum AdminActionType {
  USER_CREATED = 'USER_CREATED',
  USER_UPDATED = 'USER_UPDATED',
  USER_DELETED = 'USER_DELETED',
  USER_ROLE_CHANGED = 'USER_ROLE_CHANGED',
  USER_MODERATED = 'USER_MODERATED',
  CONTENT_MODERATED = 'CONTENT_MODERATED',
  REPORT_RESOLVED = 'REPORT_RESOLVED',
  SYSTEM_SETTING_CHANGED = 'SYSTEM_SETTING_CHANGED',
  BULK_ACTION_PERFORMED = 'BULK_ACTION_PERFORMED'
}

registerEnumType(AdminActionType, {
  name: '_admin_action_type',
  description: 'Types of admin actions',
});

@ObjectType()
@Entity('admin_audit_logs')
export class AdminAuditLog {
  @Field(() => ID)
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Field(() => User)
  @ManyToOne(() => User)
  @JoinColumn({ name: 'admin_id' })
  admin: User;

  @Column({ name: 'admin_id' })
  adminId: string;

  @Field(() => AdminActionType, { nullable: true })
  @Column({
    type: 'varchar',
    nullable: true
  })
  actionType?: AdminActionType;

  @Field()
  @Column()
  action: string;

  @Field({ nullable: true })
  @Column({ type: 'text', nullable: true })
  details?: string;

  @Field({ nullable: true })
  @Column({ nullable: true })
  entityId?: string;

  @Field({ nullable: true })
  @Column({ nullable: true })
  entityType?: string;

  @Field({ nullable: true })
  @Column({ name: 'target_user_id', nullable: true })
  targetUserId?: string;

  @Field(() => User, { nullable: true })
  @ManyToOne(() => User, { nullable: true })
  @JoinColumn({ name: 'target_user_id' })
  targetUser?: User;

  @Field(() => String, { nullable: true })
  @Column({ type: 'jsonb', nullable: true })
  metadata?: string;

  @Field()
  @Column({ name: 'ip_address' }) ipAddress: string;

  @Field()
  @CreateDateColumn({ name: 'timestamp' }) timestamp: Date;
}