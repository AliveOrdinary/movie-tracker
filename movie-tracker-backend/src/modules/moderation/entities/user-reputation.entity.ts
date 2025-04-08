// src/modules/moderation/entities/user-reputation.entity.ts
import { ObjectType, Field, ID, Int, Float } from '@nestjs/graphql';
import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  CreateDateColumn,
  UpdateDateColumn,
  OneToOne,
  JoinColumn,
  Index
} from 'typeorm';
import { User } from '../../users/entities/user.entity';

export enum ReputationLevel {
  NEW = 'NEW',
  GOOD = 'GOOD',
  TRUSTED = 'TRUSTED',
  VERIFIED = 'VERIFIED',
  LOW = 'LOW',
  RESTRICTED = 'RESTRICTED',
  NEUTRAL = 'NEUTRAL',
  QUESTIONABLE = 'QUESTIONABLE',
  UNTRUSTED = 'UNTRUSTED'
}

@ObjectType()
@Entity('user_reputation')
@Index(['reputationLevel', 'userId'])
export class UserReputation {
  @Field(() => ID)
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Field(() => User)
  @OneToOne(() => User, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'user_id' })
  user: User;

  @Column({ name: 'user_id' })
  userId: string;

  @Field(() => Float)
  @Column({ type: 'float', default: 50.0 , name: 'reputation_score' }) reputationScore: number;

  // Alias for reputationScore to maintain backward compatibility
  get score(): number {
    return this.reputationScore;
  }
  
  set score(value: number) {
    this.reputationScore = value;
  }

  @Field(() => ReputationLevel)
  @Column({ type: 'enum',
    enum: ReputationLevel,
    default: ReputationLevel.NEW
  , name: 'reputation_level' }) reputationLevel: ReputationLevel;

  // Alias for reputationLevel to maintain backward compatibility
  get level(): ReputationLevel {
    return this.reputationLevel;
  }
  
  set level(value: ReputationLevel) {
    this.reputationLevel = value;
  }

  @Field(() => Int)
  @Column({ default: 0 , name: 'content_approved_count' }) contentApprovedCount: number;

  // Alias for contentApprovedCount
  get approvedContentCount(): number {
    return this.contentApprovedCount;
  }
  
  set approvedContentCount(value: number) {
    this.contentApprovedCount = value;
  }

  @Field(() => Int)
  @Column({ default: 0 , name: 'content_rejected_count' }) contentRejectedCount: number;

  // Alias for contentRejectedCount
  get rejectedContentCount(): number {
    return this.contentRejectedCount;
  }
  
  set rejectedContentCount(value: number) {
    this.contentRejectedCount = value;
  }

  @Field(() => Int)
  @Column({ default: 0 , name: 'reports_created_count' }) reportsCreatedCount: number;

  @Field(() => Int)
  @Column({ default: 0 , name: 'report_valid_count' }) reportValidCount: number;

  // Alias for reportValidCount
  get validReportCount(): number {
    return this.reportValidCount;
  }
  
  set validReportCount(value: number) {
    this.reportValidCount = value;
  }

  @Field(() => Int)
  @Column({ default: 0 , name: 'report_invalid_count' }) reportInvalidCount: number;

  // Alias for reportInvalidCount
  get invalidReportCount(): number {
    return this.reportInvalidCount;
  }
  
  set invalidReportCount(value: number) {
    this.reportInvalidCount = value;
  }

  @Field(() => Int)
  @Column({ default: 0 , name: 'warning_count' }) warningCount: number;

  @Field(() => Date, { nullable: true })
  @Column({ type: 'timestamp', nullable: true })
  lastReviewAt?: Date;

  @Field(() => String, { nullable: true })
  @Column({ type: 'jsonb', nullable: true })
  metadata?: Record<string, any>;

  @Field(() => String, { nullable: true })
  @Column({ type: 'text', nullable: true })
  adminNotes?: string;

  @Column({ type: 'jsonb', nullable: true, default: [] })
  adjustmentHistory?: Array<{
    date: string;
    adjustment: number;
    reason: string;
    newScore: number;
  }>;

  @Field()
  @CreateDateColumn({ name: 'created_at' }) createdAt: Date;

  @Field()
  @UpdateDateColumn({ name: 'updated_at' }) updatedAt: Date;
}