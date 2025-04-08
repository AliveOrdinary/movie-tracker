// src/modules/social/entities/activity.entity.ts
import { ObjectType, Field, ID } from '@nestjs/graphql';
import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  ManyToOne,
  JoinColumn,
  CreateDateColumn,
  Index
} from 'typeorm';
import { User } from '../../users/entities/user.entity';
import { Movie } from '../../movies/entities/movie.entity';
import { Review } from '../../reviews/entities/review.entity';
import { List } from '../../lists/entities/list.entity';
import { WatchHistory } from '../../watch-history/entities/watch-history.entity';

export enum ActivityType {
  WATCHED_MOVIE = 'WATCHED_MOVIE',
  REVIEWED_MOVIE = 'REVIEWED_MOVIE',
  CREATED_LIST = 'CREATED_LIST',
  UPDATED_LIST = 'UPDATED_LIST',
  FOLLOWED_USER = 'FOLLOWED_USER',
  LIKED_REVIEW = 'LIKED_REVIEW',
  JOINED_GROUP = 'JOINED_GROUP',
  CREATED_GROUP = 'CREATED_GROUP',
  BECAME_FRIENDS = 'BECAME_FRIENDS',
  COMMENTED_ON_REVIEW = 'COMMENTED_ON_REVIEW',
  SHARED_CONTENT = 'SHARED_CONTENT',
  MILESTONE_REACHED = 'MILESTONE_REACHED',
  ADDED_REVIEW = 'ADDED_REVIEW',
  REVIEW_COMMENT = 'REVIEW_COMMENT',
  REVIEW_LIKE = 'REVIEW_LIKE',
  REVIEW_SHARE = 'REVIEW_SHARE',
  REVIEW_REPORT = 'REVIEW_REPORT',
  REVIEW_EDIT = 'REVIEW_EDIT'
}

@ObjectType()
@Entity('activities')
@Index(['user_id', 'createdAt'])
export class Activity {
  @Field(() => ID)
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Field(() => User)
  @ManyToOne(() => User, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'user_id' })
  user: User;

  @Column({ name: 'user_id'  }) user_id: string;

  @Field(() => String)
  @Column({
    type: 'enum',
    enum: ActivityType
  })
  type: ActivityType;

  @Field(() => Movie, { nullable: true })
  @ManyToOne(() => Movie, { nullable: true })
  @JoinColumn({ name: 'movie_id' })
  movie?: Movie;

  @Column({ name: 'movie_id', nullable: true })
  movie_id?: string;

  @Field(() => Review, { nullable: true })
  @ManyToOne(() => Review, { nullable: true, onDelete: 'CASCADE' })
  @JoinColumn({ name: 'review_id' })
  review?: Review;

  @Column({ name: 'review_id', nullable: true })
  review_id?: string;

  @Field(() => List, { nullable: true })
  @ManyToOne(() => List, { nullable: true, onDelete: 'CASCADE' })
  @JoinColumn({ name: 'list_id' })
  list?: List;

  @Column({ name: 'list_id', nullable: true })
  list_id?: string;

  @Field(() => WatchHistory, { nullable: true })
  @ManyToOne(() => WatchHistory, { nullable: true, onDelete: 'CASCADE' })
  @JoinColumn({ name: 'watch_history_id' })
  watchHistory?: WatchHistory;

  @Column({ name: 'watch_history_id', nullable: true })
  watch_history_id?: string;

  @Field(() => User, { nullable: true })
  @ManyToOne(() => User, { nullable: true })
  @JoinColumn({ name: 'target_user_id' })
  targetUser?: User;

  @Column({ name: 'target_user_id', nullable: true })
  target_user_id?: string;

  @Field(() => String, { nullable: true })
  @Column({ type: 'jsonb', nullable: true })
  metadata?: Record<string, any>;

  @Field()
  @CreateDateColumn({ name: 'created_at' }) createdAt: Date;
}