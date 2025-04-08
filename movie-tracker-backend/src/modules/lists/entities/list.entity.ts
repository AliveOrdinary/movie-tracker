// src/modules/lists/entities/list.entity.ts
import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  OneToMany,
  JoinColumn,
} from 'typeorm';
import { ObjectType, Field, ID, Int } from '@nestjs/graphql';
import { User } from '../../users/entities/user.entity';
import { ListItem } from './list-item.entity';
import { ListCollaborator } from './list-collaborator.entity';
import { ListType, ListPrivacy, CollaboratorPermission } from '../../../common/enums';

@ObjectType()
@Entity('lists')
export class List {
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
  thumbnail?: string;

  @Field(() => ListType)
  @Column({
    type: 'enum',
    enum: ListType,
    default: ListType.CUSTOM,
    name: 'type' // Keep DB column name, but use uppercase TypeScript enum
  })
  type: ListType;

  @Field(() => ListPrivacy)
  @Column({ 
    type: 'enum',
    enum: ListPrivacy,
    default: ListPrivacy.PRIVATE,
    name: 'privacy' // Keep DB column name, but use uppercase TypeScript enum
  }) 
  privacy: ListPrivacy;

  @Field({ nullable: true })
  @Column({ nullable: true })
  category?: string;

  @Field(() => User)
  @ManyToOne(() => User, { nullable: false, onDelete: 'CASCADE' })
  @JoinColumn({ name: 'owner_id' })
  owner: User;

  @Column({ name: 'owner_id', nullable: false })
  @Field()
  owner_id: string;

  @Field(() => Number, { nullable: true })
  @Column({ nullable: true, name: 'max_entries' })
  maxEntries?: number;

  @Field(() => Number)
  @Column({ default: 0, name: 'favorite_count' }) 
  favoriteCount: number;

  @Field(() => Boolean)
  @Column({ default: false, name: 'is_featured' }) 
  isFeatured: boolean;

  @Field(() => [ListItem], { nullable: false, defaultValue: [] })
  @OneToMany(() => ListItem, item => item.list)
  items: ListItem[];

  @Field(() => [ListCollaborator], { nullable: false, defaultValue: [] })
  @OneToMany(() => ListCollaborator, collaborator => collaborator.list)
  collaborators: ListCollaborator[];

  @Field()
  @CreateDateColumn({ name: 'created_at' }) 
  createdAt: Date;

  @Field()
  @UpdateDateColumn({ name: 'updated_at' }) 
  updatedAt: Date;

  // Virtual fields for GraphQL only
  @Field(() => Int)
  itemCount: number;

  @Field(() => Boolean)
  isFavorited: boolean;

  @Field(() => Boolean)
  isCollaborator: boolean;

  @Field(() => [CollaboratorPermission], { nullable: true })
  userPermissions?: CollaboratorPermission[];

  // Standardize property names to match camelCase pattern
  // while keeping database columns in snake_case
  @Field(() => Boolean, { nullable: true })
  @Column({ name: 'is_flagged', default: false }) 
  isFlagged: boolean;

  @Column({ nullable: true, type: 'text', name: 'moderation_reason' })
  moderationReason?: string;

  @Column({ nullable: true, name: 'moderated_at' })
  moderatedAt?: Date;

  @Column({ default: false, name: 'is_rejected' }) 
  isRejected: boolean;

  @Column({ default: false, name: 'is_auto_moderated' }) 
  isAutoModerated: boolean;
}