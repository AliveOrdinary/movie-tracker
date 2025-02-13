// src/modules/movies/entities/movie.entity.ts
import { Entity, Column, PrimaryGeneratedColumn, OneToMany } from 'typeorm';
import { ObjectType, Field, ID } from '@nestjs/graphql';
import { Review } from '../../reviews/entities/review.entity';

@ObjectType()
@Entity()
export class Movie {
  @Field(() => ID)
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Field()
  @Column()
  tmdbId: number;

  @Field()
  @Column()
  title: string;

  @Field()
  @Column()
  originalTitle: string;

  @Field()
  @Column('text')
  overview: string;

  @Field()
  @Column()
  releaseYear: number;

  @Field({ nullable: true })
  @Column({ nullable: true })
  posterPath?: string;

  @Field({ nullable: true })
  @Column({ nullable: true })
  backdropPath?: string;

  @Field(() => [String])
  @Column('simple-array')
  genres: string[];

  @Field(() => Number)
  @Column({ nullable: true })
  runtime?: number;

  @Field(() => [String])
  @Column('simple-array')
  languages: string[];

  @Field()
  @Column()
  isAdult: boolean;

  @Field(() => [Review], { nullable: true })
  @OneToMany(() => Review, review => review.movie)
  reviews?: Review[];
}