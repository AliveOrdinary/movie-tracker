// src/modules/watch-history/entities/watch-history.entity.ts
import { ObjectType, Field, ID, Int, Float, registerEnumType } from '@nestjs/graphql';
import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { User } from '../../users/entities/user.entity';
import { Movie } from '../../movies/entities/movie.entity';

export enum WatchType {
  FIRST_TIME = 'FIRST_TIME',
  REWATCH = 'REWATCH'
}

registerEnumType(WatchType, {
  name: 'WatchType',
  description: 'Type of watch (first time or rewatch)',
});

@ObjectType()
@Entity('watch_history')
export class WatchHistory {
  @Field(() => ID)
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Field(() => User)
  @ManyToOne(() => User, user => user.watchHistory)
  @JoinColumn({ name: 'user_id' })
  user: User;

  @Field(() => Movie)
  @ManyToOne(() => Movie)
  @JoinColumn({ name: 'movie_id' })
  movie: Movie;

  @Field(() => Date)
  @Column('timestamp with time zone')
  watchedAt: Date;

  @Field(() => WatchType)
  @Column({
    type: 'enum',
    enum: WatchType,
    default: WatchType.FIRST_TIME
  })
  watchType: WatchType;

  @Field(() => Float, { nullable: true })
  @Column({ type: 'float', nullable: true })
  rating?: number;

  @Field({ nullable: true })
  @Column({ type: 'text', nullable: true })
  notes?: string;

  @Field(() => Int, { nullable: true })
  @Column({ type: 'int', nullable: true })
  watchDuration?: number;

  @Field(() => Boolean)
  @Column({ default: false })
  isPrivate: boolean;

  @Field(() => Date)
  @CreateDateColumn()
  createdAt: Date;

  @Field(() => Date)
  @UpdateDateColumn()
  updatedAt: Date;
}