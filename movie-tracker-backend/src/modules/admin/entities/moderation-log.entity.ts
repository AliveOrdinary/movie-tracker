//src/modules/admin/entities/moderation-log.entity.ts
import { ObjectType, Field, ID, registerEnumType } from '@nestjs/graphql';
import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  CreateDateColumn,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { User } from '../../users/entities/user.entity';
import { Review } from '../../reviews/entities/review.entity';

export enum ModerationAction {
  REVIEW_APPROVED = 'REVIEW_APPROVED',
  REVIEW_REJECTED = 'REVIEW_REJECTED',
  REVIEW_FLAGGED = 'REVIEW_FLAGGED',
  USER_WARNED = 'USER_WARNED',
  USER_SUSPENDED = 'USER_SUSPENDED',
  USER_BANNED = 'USER_BANNED',
}

registerEnumType(ModerationAction, {
  name: 'ModerationAction',
  description: 'Available moderation actions',
});

@ObjectType()
@Entity('moderation_logs')
export class ModerationLog {
  @Field(() => ID)
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Field(() => ModerationAction)
  @Column({
    type: 'enum',
    enum: ModerationAction,
  })
  action: ModerationAction;

  @Field()
  @Column('text')
  reason: string;

  @Field(() => User)
  @ManyToOne(() => User)
  @JoinColumn({ name: 'moderator_id' })
  moderator: User;

  @Field(() => User, { nullable: true })
  @ManyToOne(() => User, { nullable: true })
  @JoinColumn({ name: 'target_user_id' })
  targetUser?: User;

  @Field(() => Review, { nullable: true })
  @ManyToOne(() => Review, { nullable: true })
  @JoinColumn({ name: 'target_review_id' })
  targetReview?: Review;

  @Field(() => String, { nullable: true })
  @Column({ type: 'jsonb', nullable: true })
  metadata?: Record<string, any>;

  @Field()
  @CreateDateColumn()
  createdAt: Date;

  @Field(() => Boolean)
  @Column({ default: false })
  isResolved: boolean;

  @Field(() => Date, { nullable: true })
  @Column({ type: 'timestamp', nullable: true })
  resolvedAt?: Date;

  @Field(() => String, { nullable: true })
  @Column({ type: 'text', nullable: true })
  notes?: string;
}