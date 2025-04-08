// src/modules/social/entities/social-group.entity.ts
import { ObjectType, Field, ID, registerEnumType, Int } from '@nestjs/graphql';
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
import { SocialGroupMember } from './social-group-member.entity';

export enum GroupPrivacy {
  PUBLIC = 'PUBLIC',
  PRIVATE = 'PRIVATE',
  SECRET = 'SECRET'
}

registerEnumType(GroupPrivacy, {
  name: '_social_group_privacy',
  description: 'Privacy level of a social group',
});

@ObjectType()
@Entity('social_groups')
@Index(['creator_id', 'name'])
export class SocialGroup {
  @Field(() => ID)
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Field()
  @Column()
  name: string;

  @Field({ nullable: true })
  @Column({ type: 'text', nullable: true })
  description?: string;

  @Field({ nullable: true })
  @Column({ nullable: true })
  avatarUrl?: string;

  @Field(() => GroupPrivacy, { name: '_social_group_privacy' })
  @Column({ type: 'enum',
    enum: GroupPrivacy,
    default: GroupPrivacy.PUBLIC
  , name: 'privacy' }) privacy: GroupPrivacy;

  @Field(() => User)
  @ManyToOne(() => User, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'creator_id' })
  creator: User;

  @Column({ name: 'creator_id'  }) creator_id: string;

  @Field(() => [SocialGroupMember])
  @OneToMany(() => SocialGroupMember, member => member.group)
  members: SocialGroupMember[];

  @Field()
  @CreateDateColumn({ name: 'created_at' }) createdAt: Date;

  @Field()
  @UpdateDateColumn({ name: 'updated_at' }) updatedAt: Date;

  // Virtual fields
  @Field(() => Int)
  memberCount: number;

  @Field(() => Boolean)
  isMember: boolean;
}
