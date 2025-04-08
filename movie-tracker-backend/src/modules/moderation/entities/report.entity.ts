// src/modules/moderation/entities/report.entity.ts
import { ObjectType, Field, ID } from '@nestjs/graphql';
import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  CreateDateColumn,
  UpdateDateColumn,
  JoinColumn,
  Index
} from 'typeorm';
import { Review } from '../../reviews/entities/review.entity';
import { List } from '../../lists/entities/list.entity';
import { User } from '../../users/entities/user.entity';
import { ReportStatus, ReportResolution } from '../../../common/enums';
import { ContentType } from './moderation-queue.entity';

@ObjectType()
@Entity('reports')
@Index(['contentType', 'contentId', 'status'])
export class Report {
  @Field(() => ID)
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Field(() => ContentType)
  @Column({ type: 'enum',
    enum: ContentType
  , name: 'content_type' }) contentType: ContentType;

  @Field()
  @Column({ name: 'content_id' }) contentId: string;

  @Field(() => Review, { nullable: true })
  @ManyToOne(() => Review, { onDelete: 'CASCADE', nullable: true })
  @JoinColumn({ name: 'review_id' })
  review?: Review;

  @Field(() => List, { nullable: true })
  @ManyToOne(() => List, { onDelete: 'CASCADE', nullable: true })
  @JoinColumn({ name: 'list_id' })
  list?: List;

  @Field(() => User)
  @ManyToOne(() => User)
  @JoinColumn({ name: 'reporter_id' })
  reporter: User;

  @Column({ name: 'reporter_id' })
  reporterId: string;

  @Field(() => User, { nullable: true })
  @ManyToOne(() => User, { nullable: true })
  @JoinColumn({ name: 'moderator_id' })
  moderator?: User;

  @Column({ name: 'moderator_id', nullable: true })
  moderatorId?: string;

  @Field()
  @Column('text')
  reason: string;

  @Field(() => ReportStatus)
  @Column({ type: 'enum',
    enum: ReportStatus,
    default: ReportStatus.PENDING
  , name: 'status' }) status: ReportStatus;

  @Field(() => ReportResolution, { nullable: true })
  @Column({
    type: 'enum',
    enum: ReportResolution,
    nullable: true
  })
  resolution?: ReportResolution;

  @Field({ nullable: true })
  @Column('text', { nullable: true })
  moderatorNotes?: string;

  @Field(() => Date)
  @CreateDateColumn({ name: 'created_at' }) createdAt: Date;

  @Field(() => Date)
  @UpdateDateColumn({ name: 'updated_at' }) updatedAt: Date;

  @Field(() => Date, { nullable: true })
  @Column('timestamp', { nullable: true })
  resolvedAt?: Date;

}