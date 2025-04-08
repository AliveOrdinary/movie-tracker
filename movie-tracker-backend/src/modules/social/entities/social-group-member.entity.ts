// src/modules/social/entities/social-group-member.entity.ts
import { ObjectType, Field, ID, registerEnumType } from '@nestjs/graphql';
import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  ManyToOne,
  JoinColumn,
  CreateDateColumn,
  UpdateDateColumn,
  Unique,
  Index
} from 'typeorm';
import { User } from '../../users/entities/user.entity';
import { SocialGroup } from './social-group.entity';

export enum GroupMemberRole {
  MEMBER = 'MEMBER',
  MODERATOR = 'MODERATOR',
  ADMIN = 'ADMIN'
}

registerEnumType(GroupMemberRole, {
  name: '_group_member_role',
  description: 'Role of a user in a social group',
});

@ObjectType()
@Entity('social_group_members')
@Unique(['group_id', 'user_id'])
@Index(['group_id', 'user_id', 'role'])
export class SocialGroupMember {
  @Field(() => ID)
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Field(() => SocialGroup)
  @ManyToOne(() => SocialGroup, group => group.members, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'group_id' })
  group: SocialGroup;

  @Column({ name: 'group_id'  }) group_id: string;

  @Field(() => User)
  @ManyToOne(() => User, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'user_id' })
  user: User;

  @Column({ name: 'user_id'  }) user_id: string;

  @Field(() => GroupMemberRole)
  @Column({ type: 'enum',
    enum: GroupMemberRole,
    default: GroupMemberRole.MEMBER
  , name: 'role' }) role: GroupMemberRole;

  @Field()
  @CreateDateColumn({ name: 'created_at' }) createdAt: Date;

  @Field()
  @UpdateDateColumn({ name: 'updated_at' }) updatedAt: Date;
}
