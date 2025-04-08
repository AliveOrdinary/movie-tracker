//src/modules/admin/entities/moderation-log.entity.ts
import { ObjectType, Field, ID } from '@nestjs/graphql';
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
import { ModerationAction } from '../../../common/enums';

@ObjectType()
@Entity('moderation_logs')
export class ModerationLog {
  @Field(() => ID)
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Field(() => String)
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
  @CreateDateColumn({ name: 'created_at' }) createdAt: Date;

  @Field(() => Boolean)
  @Column({ default: false , name: 'is_resolved' }) isResolved: boolean;

  @Field(() => Date, { nullable: true })
  @Column({ type: 'timestamp', nullable: true })
  resolvedAt?: Date;

  @Field(() => String, { nullable: true })
  @Column({ type: 'text', nullable: true })
  notes?: string;
}