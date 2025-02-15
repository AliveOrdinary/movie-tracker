// src/modules/reviews/entities/review-reaction.entity.ts
import { ObjectType, Field, ID, registerEnumType } from '@nestjs/graphql';
import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  CreateDateColumn,
  ManyToOne,
  JoinColumn,
  Unique,
} from 'typeorm';
import { User } from '../../users/entities/user.entity';
import { Review } from './review.entity';

export enum ReactionType {
  LIKE = 'LIKE',
  LOVE = 'LOVE',
  FUNNY = 'FUNNY',
  INSIGHTFUL = 'INSIGHTFUL',
  DISAGREE = 'DISAGREE'
}

registerEnumType(ReactionType, {
  name: 'ReactionType',
  description: 'Type of reaction on a review',
});

@ObjectType()
@Entity('review_reactions')
@Unique(['user', 'review', 'type'])
export class ReviewReaction {
  @Field(() => ID)
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Field(() => User)
  @ManyToOne(() => User)
  @JoinColumn({ name: 'user_id' })
  user: User;

  @Field(() => Review)
  @ManyToOne(() => Review, review => review.reactions)
  @JoinColumn({ name: 'review_id' })
  review: Review;

  @Field(() => ReactionType)
  @Column({
    type: 'enum',
    enum: ReactionType,
  })
  type: ReactionType;

  @Field()
  @CreateDateColumn()
  createdAt: Date;
}