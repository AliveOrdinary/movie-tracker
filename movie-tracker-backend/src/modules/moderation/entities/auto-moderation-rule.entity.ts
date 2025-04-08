// src/modules/moderation/entities/auto-moderation-rule.entity.ts
import { ObjectType, Field, ID, Int } from '@nestjs/graphql';
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
import { ContentType } from './moderation-queue.entity';

export enum RuleType {
  KEYWORD = 'KEYWORD',
  REGEX = 'REGEX',
  USER_REPUTATION = 'USER_REPUTATION',
  CONTENT_SIMILARITY = 'CONTENT_SIMILARITY',
  SPAM_DETECTION = 'SPAM_DETECTION'
}

export enum RuleAction {
  FLAG = 'FLAG',
  REJECT = 'REJECT',
  DELETE = 'DELETE',
  NOTIFY_MODERATOR = 'NOTIFY_MODERATOR'
}

@ObjectType()
@Entity('auto_moderation_rules')
@Index(['isActive', 'contentType'])
export class AutoModerationRule {
  @Field(() => ID)
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Field()
  @Column()
  name: string;

  @Field()
  @Column({ type: 'text' })
  description: string;

  @Field(() => RuleType)
  @Column({ type: 'enum',
    enum: RuleType
  , name: 'rule_type' }) ruleType: RuleType;

  @Field(() => ContentType)
  @Column({ type: 'enum',
    enum: ContentType
  , name: 'content_type' }) contentType: ContentType;

  @Field(() => RuleAction)
  @Column({
    type: 'enum',
    enum: RuleAction
  })
  action: RuleAction;

  @Field(() => String)
  @Column({ type: 'jsonb' , name: 'pattern' }) pattern: any;

  @Field(() => Int)
  @Column({ default: 50 , name: 'threshold' }) threshold: number;

  @Field()
  @Column({ default: true , name: 'is_active' }) isActive: boolean;

  @Field(() => User)
  @ManyToOne(() => User)
  @JoinColumn({ name: 'created_by_id' })
  createdBy: User;

  @Column({ name: 'created_by_id' })
  createdById: string;

  @Field(() => Int)
  @Column({ default: 0 , name: 'match_count' }) matchCount: number;

  @Field(() => String, { nullable: true })
  @Column({ type: 'jsonb', nullable: true })
  metadata?: Record<string, any>;

  @Field()
  @CreateDateColumn({ name: 'created_at' }) createdAt: Date;

  @Field()
  @UpdateDateColumn({ name: 'updated_at' }) updatedAt: Date;
}
