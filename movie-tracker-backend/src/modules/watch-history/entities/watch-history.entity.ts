// src/modules/watch-history/entities/watch-history.entity.ts
import { ObjectType, Field, ID, Int, Float } from '@nestjs/graphql';
import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  JoinColumn,
  Index,
} from 'typeorm';
import { User } from '../../users/entities/user.entity';
import { Movie } from '../../movies/entities/movie.entity';
import { WatchType } from '../../../common/enums';

@ObjectType()
@Entity('watch_history')
@Index(['userId', 'movieId'])
@Index(['userId', 'watchedAt'])
export class WatchHistory {
  @Field(() => ID)
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Field(() => User)
  @ManyToOne(() => User, user => user.watchHistory)
  @JoinColumn({ name: 'user_id' })
  user: User;

  @Column({ name: 'user_id' }) 
  userId: string;

  @Field(() => Movie)
  @ManyToOne(() => Movie)
  @JoinColumn({ name: 'movie_id' })
  movie: Movie;

  @Column({ name: 'movie_id' }) 
  movieId: string;

  @Field(() => Date)
  @Column('timestamp with time zone', { name: 'watched_at' })
  watchedAt: Date;

  @Field(() => WatchType)
  @Column({ 
    type: 'enum',
    enum: WatchType,
    default: WatchType.FIRST_TIME,
    name: 'watch_type' 
  }) 
  watchType: WatchType;

  @Field(() => Float, { nullable: true })
  @Column({ type: 'float', nullable: true })
  rating?: number;

  @Field({ nullable: true })
  @Column({ type: 'text', nullable: true })
  notes?: string;

  @Field(() => Int, { nullable: true })
  @Column({ type: 'int', nullable: true, name: 'watch_duration' })
  watchDuration?: number;

  @Field(() => Boolean)
  @Column({ default: false, name: 'is_private' }) 
  isPrivate: boolean;

  @Field(() => Int, { defaultValue: 1 })
  @Column({ type: 'int', default: 1, name: 'watch_count' }) 
  watchCount: number;

  @Field(() => Boolean)
  @Column({ default: false, name: 'is_favorite' }) 
  isFavorite: boolean;

  @Field(() => String, { nullable: true })
  @Column({ type: 'varchar', nullable: true, name: 'context_tags' })
  contextTags?: string;

  @Field(() => Int, { nullable: true })
  @Column({ type: 'int', nullable: true, name: 'mood_rating' })
  moodRating?: number;

  @Field(() => Date)
  @CreateDateColumn({ name: 'created_at' }) 
  createdAt: Date;

  @Field(() => Date)
  @UpdateDateColumn({ name: 'updated_at' }) 
  updatedAt: Date;
}