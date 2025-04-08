// src/modules/social/entities/activity-comment.entity.ts
import { ObjectType, Field, ID, Int } from '@nestjs/graphql';
import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  ManyToOne,
  OneToMany,
  JoinColumn,
  CreateDateColumn,
  UpdateDateColumn,
  Index
} from 'typeorm';
import { User } from '../../users/entities/user.entity';
import { Activity } from './activity.entity';

@ObjectType()
@Entity('activity_comments')
@Index(['activity_id', 'createdAt'])
export class ActivityComment {
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

  @Field(() => ActivityComment, { nullable: true })
  @ManyToOne(() => ActivityComment, comment => comment.childComments, { nullable: true })
  @JoinColumn({ name: 'parent_comment_id' })
  parentComment?: ActivityComment;

  @Column({ name: 'parent_comment_id', nullable: true })
  parent_comment_id?: string;

  @Field(() => [ActivityComment], { nullable: true })
  @OneToMany(() => ActivityComment, comment => comment.parentComment)
  childComments?: ActivityComment[];

  @Field()
  @Column({ type: 'text' })
  content: string;

  @Field(() => Boolean)
  @Column({ default: false , name: 'is_edited' }) isEdited: boolean;

  @Field(() => Int)
  @Column({ default: 0 , name: 'like_count' }) likeCount: number;

  @Field()
  @CreateDateColumn({ name: 'created_at' }) createdAt: Date;

  @Field()
  @UpdateDateColumn({ name: 'updated_at' }) updatedAt: Date;
}
