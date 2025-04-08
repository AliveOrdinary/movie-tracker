// src/modules/movies/entities/movie.entity.ts
import { Entity, Column, PrimaryGeneratedColumn, OneToMany, CreateDateColumn, UpdateDateColumn } from 'typeorm';
import { ObjectType, Field, ID, Int, Float } from '@nestjs/graphql';
import { Review } from '../../reviews/entities/review.entity';
import { MovieWatchProviders } from '../types/watch-providers.types';

@ObjectType()
export class MovieImages {
  @Field({ nullable: true })
  poster?: string;

  @Field({ nullable: true })
  backdrop?: string;
}

@ObjectType()
@Entity('movies')
export class Movie {
  @Field(() => ID)
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Field(() => Int)
  @Column({ unique: true , name: 'tmdb_id' }) tmdbId: number;

  @Field()
  @Column()
  title: string;

  @Field()
  @Column({ name: 'original_title'  }) originalTitle: string;

  @Field()
  @Column('text')
  overview: string;

  @Field(() => Int)
  @Column({ name: 'release_year'  }) releaseYear: number;

  @Field({ nullable: true })
  @Column({ nullable: true, name: 'poster_path' })
  posterPath?: string;

  @Field({ nullable: true })
  @Column({ nullable: true, name: 'backdrop_path' })
  backdropPath?: string;

  @Field(() => [String])
  @Column('simple-array')
  genres: string[];

  @Field(() => Int, { nullable: true })
  @Column({ nullable: true })
  runtime?: number;

  @Field(() => [String])
  @Column('simple-array')
  languages: string[];

  @Field()
  @Column({ name: 'is_adult' }) isAdult: boolean;

  @Field(() => [Review], { nullable: true })
  @OneToMany(() => Review, review => review.movie)
  reviews?: Review[];

  // Add these fields to match the database schema
  @Field(() => Float, { nullable: true })
  @Column({ type: 'numeric', nullable: true, precision: 4, scale: 2, name: 'vote_average' })
  voteAverage?: number;

  @Field(() => Int, { nullable: true })
  @Column({ nullable: true, name: 'vote_count' })
  voteCount?: number;

  @Field()
  @Column({ name: 'is_popular', default: false  }) isPopular: boolean;

  // Add timestamp columns
  @Field(() => Date)
  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @Field(() => Date)
  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;

  // Kept virtual fields
  @Field(() => Boolean, { nullable: true })
  isInWatchlist?: boolean;

  @Field(() => Float, { nullable: true })
  userRating?: number;

  // Add URL fields that are resolved in the resolver
  @Field(() => String, { nullable: true })
  posterUrl?: string;

  @Field(() => String, { nullable: true })
  backdropUrl?: string;

  @Field(() => MovieImages, { nullable: true })
  images?: MovieImages;

  @Field(() => MovieWatchProviders, { nullable: true })
  watchProviders?: MovieWatchProviders;
}