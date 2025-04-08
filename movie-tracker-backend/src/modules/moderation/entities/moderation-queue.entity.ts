// src/modules/moderation/entities/moderation-queue.entity.ts
import { ObjectType, Field, ID, Int, registerEnumType } from '@nestjs/graphql';
import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  JoinColumn,
  Index
} from 'typeorm';
import { User } from '../../users/entities/user.entity';
import { Review } from '../../reviews/entities/review.entity';
import { List } from '../../lists/entities/list.entity';

export enum ContentType {
  REVIEW = 'REVIEW',
  LIST = 'LIST',
  USER_PROFILE = 'USER_PROFILE'
}

// Register the enum with GraphQL
registerEnumType(ContentType, {
  name: '_content_type',
  description: 'Type of content to be moderated',
});

export enum ModerationStatus {
  PENDING = 'PENDING',
  IN_REVIEW = 'IN_REVIEW',
  APPROVED = 'APPROVED',
  REJECTED = 'REJECTED',
  DELETED = 'DELETED'
}

// Register the ModerationStatus enum with GraphQL (if not already registered)
registerEnumType(ModerationStatus, {
  name: '_moderation_status',
  description: 'Status of an item in the moderation queue',
});

export enum ModerationPriority {
  LOW = 'LOW',
  MEDIUM = 'MEDIUM',
  HIGH = 'HIGH',
  URGENT = 'URGENT'
}

// Register the ModerationPriority enum with GraphQL (if not already registered)
registerEnumType(ModerationPriority, {
  name: '_moderation_priority',
  description: 'Priority of an item in the moderation queue',
});

@ObjectType()
@Entity('moderation_queue')
@Index(['status', 'priority'])
@Index(['contentType', 'contentId'])
export class ModerationQueue {
  @Field(() => ID)
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Field(() => ContentType)
  @Column({ type: 'enum',
    enum: ContentType
  , name: 'content_type' }) contentType: ContentType;

  @Field()
  @Column({ name: 'content_id' }) contentId: string;

  @Field(() => ModerationStatus)
  @Column({ type: 'enum',
    enum: ModerationStatus,
    default: ModerationStatus.PENDING
  , name: 'status' }) status: ModerationStatus;

  @Field(() => ModerationPriority)
  @Column({ type: 'enum',
    enum: ModerationPriority,
    default: ModerationPriority.MEDIUM
  , name: 'priority' }) priority: ModerationPriority;

  @Field(() => User, { nullable: true })
  @ManyToOne(() => User, { nullable: true })
  @JoinColumn({ name: 'assigned_to_id' })
  assignedTo?: User;

  @Column({ name: 'assigned_to_id', nullable: true })
  assignedToId?: string;

  @Field(() => User, { nullable: true })
  @ManyToOne(() => User, { nullable: true })
  @JoinColumn({ name: 'moderated_by_id' })
  moderatedBy?: User;

  @Column({ name: 'moderated_by_id', nullable: true })
  moderatedById?: string;

  @Field(() => Review, { nullable: true })
  @ManyToOne(() => Review, { nullable: true, onDelete: 'CASCADE' })
  @JoinColumn({ name: 'review_id' })
  review?: Review;

  @Column({ name: 'review_id', nullable: true })
  reviewId?: string;

  @Field(() => List, { nullable: true })
  @ManyToOne(() => List, { nullable: true, onDelete: 'CASCADE' })
  @JoinColumn({ name: 'list_id' })
  list?: List;

  @Column({ name: 'list_id', nullable: true })
  listId?: string;

  @Field(() => User, { nullable: true })
  @ManyToOne(() => User, { nullable: true })
  @JoinColumn({ name: 'target_user_id' })
  targetUser?: User;

  @Column({ name: 'target_user_id', nullable: true })
  targetUserId?: string;

  @Field(() => Int)
  @Column({ default: 0 , name: 'report_count' }) reportCount: number;

  @Field({ nullable: true })
  @Column({ type: 'text', nullable: true })
  moderationNotes?: string;

  @Field(() => Date, { nullable: true })
  @Column({ type: 'timestamp', nullable: true })
  moderatedAt?: Date;

  @Field(() => Date, { nullable: true })
  @Column({ type: 'timestamp', nullable: true })
  assignedAt?: Date;

  @Field(() => Boolean)
  @Column({ default: false , name: 'is_auto_flagged' }) isAutoFlagged: boolean;

  @Field(() => String, { nullable: true })
  @Column({ type: 'jsonb', nullable: true })
  metadata?: Record<string, any>;

  @Field()
  @CreateDateColumn({ name: 'created_at' }) createdAt: Date;

  @Field()
  @UpdateDateColumn({ name: 'updated_at' }) updatedAt: Date;
}