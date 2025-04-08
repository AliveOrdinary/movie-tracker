// src/modules/notifications/entities/notification.entity.ts
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
import { Review } from '../../reviews/entities/review.entity';
import { List } from '../../lists/entities/list.entity';
import { Movie } from '../../movies/entities/movie.entity';

export enum NotificationType {
  FOLLOW = 'FOLLOW',
  REVIEW_LIKE = 'REVIEW_LIKE',
  REVIEW_COMMENT = 'REVIEW_COMMENT',
  LIST_FAVORITE = 'LIST_FAVORITE',
  LIST_COLLABORATION = 'LIST_COLLABORATION',
  MOVIE_RELEASE = 'MOVIE_RELEASE',
  SYSTEM_MESSAGE = 'SYSTEM_MESSAGE'
}

@ObjectType()
@Entity('notifications')
@Index(['user_id', 'createdAt'])
export class Notification {
  @Field(() => ID)
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Field(() => User)
  @ManyToOne(() => User, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'user_id' })
  user: User;

  @Column({ name: 'user_id'  }) user_id: string;

  @Field(() => User, { nullable: true })
  @ManyToOne(() => User, { nullable: true })
  @JoinColumn({ name: 'actor_id' })
  actor?: User;

  @Column({ name: 'actor_id', nullable: true })
  actor_id?: string;

  @Field(() => String)
  @Column({
    type: 'enum',
    enum: NotificationType
  })
  type: NotificationType;

  @Field()
  @Column()
  message: string;

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

  @Field(() => Movie, { nullable: true })
  @ManyToOne(() => Movie, { nullable: true })
  @JoinColumn({ name: 'movie_id' })
  movie?: Movie;

  @Column({ name: 'movie_id', nullable: true })
  movie_id?: string;

  @Field(() => Boolean)
  @Column({ default: false , name: 'is_read' }) isRead: boolean;

  @Field()
  @CreateDateColumn({ name: 'created_at' }) createdAt: Date;

  @Field(() => String, { nullable: true })
  @Column({ type: 'jsonb', nullable: true })
  metadata?: Record<string, any>;
}
