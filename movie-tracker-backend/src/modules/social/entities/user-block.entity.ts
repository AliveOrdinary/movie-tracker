// src/modules/social/entities/user-block.entity.ts
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
@Entity('user_blocks')
@Unique(['blocker_id', 'blocked_id'])
@Index(['blocker_id', 'blocked_id'])
export class UserBlock {
  @Field(() => ID)
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Field(() => User)
  @ManyToOne(() => User, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'blocker_id' })
  blocker: User;

  @Column({ name: 'blocker_id'  }) blocker_id: string;

  @Field(() => User)
  @ManyToOne(() => User, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'blocked_id' })
  blocked: User;

  @Column({ name: 'blocked_id'  }) blocked_id: string;

  @Field({ nullable: true })
  @Column({ type: 'text', nullable: true })
  reason?: string;

  @Field()
  @CreateDateColumn({ name: 'created_at' }) createdAt: Date;
}
