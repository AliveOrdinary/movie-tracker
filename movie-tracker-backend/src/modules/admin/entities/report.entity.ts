//src/modules/admin/entities/report.entity.ts
import { ObjectType, Field, ID, registerEnumType } from '@nestjs/graphql';
import { 
  Entity, 
  PrimaryGeneratedColumn, 
  Column, 
  ManyToOne, 
  CreateDateColumn,
  UpdateDateColumn,
  JoinColumn
} from 'typeorm';
import { Review } from '../../reviews/entities/review.entity';
import { User } from '../../users/entities/user.entity';

export enum ReportStatus {
  PENDING = 'PENDING',
  RESOLVED = 'RESOLVED',
  DISMISSED = 'DISMISSED'
}

export enum ReportResolution {
  DELETE = 'DELETE',
  WARNING = 'WARNING',
  DISMISS = 'DISMISS'
}

registerEnumType(ReportStatus, {
  name: 'ReportStatus',
  description: 'Status of a content report',
});

registerEnumType(ReportResolution, {
  name: 'ReportResolution',
  description: 'Resolution type for a report',
});

@ObjectType()
@Entity('reports')
export class Report {
  @Field(() => ID)
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Field(() => Review)
  @ManyToOne(() => Review, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'review_id' })
  review: Review;

  @Field(() => User)
  @ManyToOne(() => User)
  @JoinColumn({ name: 'reporter_id' })
  reporter: User;

  @Field(() => User, { nullable: true })
  @ManyToOne(() => User)
  @JoinColumn({ name: 'moderator_id' })
  moderator?: User;

  @Field()
  @Column('text')
  reason: string;

  @Field(() => ReportStatus)
  @Column({
    type: 'enum',
    enum: ReportStatus,
    default: ReportStatus.PENDING
  })
  status: ReportStatus;

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
  @CreateDateColumn()
  createdAt: Date;

  @Field(() => Date)
  @UpdateDateColumn()
  updatedAt: Date;

  @Field(() => Date, { nullable: true })
  @Column('timestamp', { nullable: true })
  resolvedAt?: Date;
}