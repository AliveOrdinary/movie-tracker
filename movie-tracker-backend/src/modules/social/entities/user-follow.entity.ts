// src/modules/social/entities/user-follow.entity.ts
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

@ObjectType()
@Entity('user_follows')
@Unique(['follower', 'following'])
@Index(['follower_id', 'following_id'])
export class UserFollow {
  @Field(() => ID)
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Field(() => User)
  @ManyToOne(() => User, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'follower_id' })
  follower: User;

  @Column({ name: 'follower_id'  }) follower_id: string;

  @Field(() => User)
  @ManyToOne(() => User, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'following_id' })
  following: User;

  @Column({ name: 'following_id'  }) following_id: string;

  @Field()
  @CreateDateColumn({ name: 'created_at' }) createdAt: Date;
}