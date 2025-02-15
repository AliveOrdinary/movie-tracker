// src/modules/reviews/entities/review.entity.ts
import { ObjectType, Field, ID, Int, registerEnumType } from '@nestjs/graphql';
import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  OneToMany,
  JoinColumn,
  OneToOne,
} from 'typeorm';
import { User } from '../../users/entities/user.entity';
import { Movie } from '../../movies/entities/movie.entity';
import { WatchHistory } from '../../watch-history/entities/watch-history.entity';
import { ReviewReaction } from './review-reaction.entity';

export enum ReviewStatus {
  PENDING = 'PENDING',
  APPROVED = 'APPROVED',
  REJECTED = 'REJECTED',
  FLAGGED = 'FLAGGED',
}

registerEnumType(ReviewStatus, {
  name: 'ReviewStatus',
  description: 'Status of a review',
});

@ObjectType()
@Entity('reviews')
export class Review {
  @Field(() => ID)
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Field(() => User)
  @ManyToOne(() => User, user => user.reviews)
  @JoinColumn({ name: 'user_id' })
  user: User;

  @Field(() => Movie)
  @ManyToOne(() => Movie, movie => movie.reviews)
  @JoinColumn({ name: 'movie_id' })
  movie: Movie;

  @Field(() => WatchHistory, { nullable: true })
  @OneToOne(() => WatchHistory)
  @JoinColumn({ name: 'watch_history_id' })
  watchHistory?: WatchHistory;

  @Field()
  @Column({ length: 300 }) // Enforcing 300 character limit
  content: string;

  @Field(() => Int)
  @Column()
  rating: number;

  @Field(() => ReviewStatus)
  @Column({
    type: 'enum',
    enum: ReviewStatus,
    default: ReviewStatus.PENDING,
  })
  status: ReviewStatus;

  @Field(() => Boolean)
  @Column({ default: false })
  containsSpoilers: boolean;

  @Field(() => [ReviewReaction])
  @OneToMany(() => ReviewReaction, reaction => reaction.review)
  reactions: ReviewReaction[];

  @Field(() => Int)
  @Column({ default: 0 })
  reactionCount: number;

  @Field({ nullable: true })
  @Column({ type: 'text', nullable: true })
  moderationReason?: string;

  @Field(() => Boolean)
  @Column({ default: false })
  isFlagged: boolean;

  @Field({ nullable: true })
  @Column({ type: 'timestamp', nullable: true })
  moderatedAt?: Date;

  @Field()
  @CreateDateColumn()
  createdAt: Date;

  @Field()
  @UpdateDateColumn()
  updatedAt: Date;

  @Field(() => [String], { nullable: true })
  @Column('text', { array: true, nullable: true })
  tags?: string[];

  @Field(() => Int)
  @Column({ default: 0 })
  helpfulVotes: number;

  @Field(() => Boolean)
  @Column({ default: false })
  isEdited: boolean;
}