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
    Index
  } from 'typeorm';
import { ObjectType, Field, ID, Int, registerEnumType } from '@nestjs/graphql';
import { User } from '../../users/entities/user.entity';
import { ListItem } from './list-item.entity';
import { ListCollaborator, CollaboratorPermission } from './list-collaborator.entity';
  
  export enum ListType {
    STANDARD = 'standard',
    CUSTOM = 'custom'
  }
  
  export enum ListPrivacy {
    PUBLIC = 'public',
    PRIVATE = 'private',
    FOLLOWING = 'following'
  }
  
  registerEnumType(ListType, {
    name: 'ListType',
    description: 'Type of list (standard or custom)',
  });
  
  registerEnumType(ListPrivacy, {
    name: 'ListPrivacy',
    description: 'Privacy level of the list',
  });
  
  @ObjectType()
  @Entity('lists')
  @Index(['ownerId', 'type'])
  @Index(['privacy', 'createdAt'])
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
      default: ListType.CUSTOM
    })
    type: ListType;
  
    @Field(() => ListPrivacy)
    @Column({
      type: 'enum',
      enum: ListPrivacy,
      default: ListPrivacy.PRIVATE
    })
    privacy: ListPrivacy;
  
    @Field({ nullable: true })
    @Column({ nullable: true })
    category?: string;
  
    @Field(() => User)
    @ManyToOne(() => User, { onDelete: 'CASCADE' })
    @JoinColumn({ name: 'owner_id' })
    owner: User;
  
    @Column()
    ownerId: string;
  
    @Field(() => Number, { nullable: true })
    @Column({ nullable: true })
    maxEntries?: number;
  
    @Field(() => Number)
    @Column({ default: 0 })
    favoriteCount: number;
  
    @Field(() => [ListItem])
    @OneToMany(() => ListItem, item => item.list)
    items: ListItem[];
  
    @Field(() => [ListCollaborator])
    @OneToMany(() => ListCollaborator, collaborator => collaborator.list)
    collaborators: ListCollaborator[];
  
    @Field()
    @CreateDateColumn()
    createdAt: Date;
  
    @Field()
    @UpdateDateColumn()
    updatedAt: Date;

    @Field(() => Int)
    itemCount: number;

    @Field(() => Boolean)
    isFavorited: boolean;

    @Field(() => Boolean)
    isCollaborator: boolean;

    @Field(() => [CollaboratorPermission], { nullable: true })
    userPermissions?: CollaboratorPermission[];
  }