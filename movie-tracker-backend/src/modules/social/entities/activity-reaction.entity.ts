// src/modules/social/entities/activity-reaction.entity.ts
import { ObjectType, Field, ID } from '@nestjs/graphql';
import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  ManyToOne,
  JoinColumn,
  CreateDateColumn,
  Unique,
  Index
} from 'typeorm';
import { User } from '../../users/entities/user.entity';
import { Activity } from './activity.entity';
import { ReactionType } from '../../../common/enums';

@ObjectType()
@Entity('activity_reactions')
@Unique(['activity_id', 'user_id', 'type'])
@Index(['activity_id', 'type'])
export class ActivityReaction {
  @Field(() => ID)
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Field(() => Activity)
  @ManyToOne(() => Activity, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'activity_id' })
  activity: Activity;

  @Column({ name: 'activity_id'  }) activity_id: string;

  @Field(() => User)
  @ManyToOne(() => User, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'user_id' })
  user: User;

  @Column({ name: 'user_id'  }) user_id: string;

  @Field(() => ReactionType)
  @Column({
    type: 'enum',
    enum: ReactionType
  })
  type: ReactionType;

  @Field()
  @CreateDateColumn({ name: 'created_at' }) createdAt: Date;
}
