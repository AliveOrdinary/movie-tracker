// src/modules/lists/entities/list-collaborator.entity.ts
import {
    Entity,
    Column,
    PrimaryGeneratedColumn,
    CreateDateColumn,
    ManyToOne,
    JoinColumn,
    Index,
    Unique
  } from 'typeorm';
  import { ObjectType, Field, ID, registerEnumType } from '@nestjs/graphql';
  import { List } from './list.entity';
  import { User } from '../../users/entities/user.entity';
  
  export enum CollaboratorPermission {
    VIEW = 'view',
    ADD_ITEMS = 'add_items',
    REMOVE_ITEMS = 'remove_items',
    EDIT_DETAILS = 'edit_details',
    INVITE_OTHERS = 'invite_others'
  }
  
  registerEnumType(CollaboratorPermission, {
    name: 'CollaboratorPermission',
    description: 'Permission level for list collaborators',
  });
  
  @ObjectType()
  @Entity('list_collaborators')
  @Unique(['listId', 'userId'])
  @Index(['listId', 'userId'])
  export class ListCollaborator {
    @Field(() => ID)
    @PrimaryGeneratedColumn('uuid')
    id: string;
  
    @Field(() => List)
    @ManyToOne(() => List, list => list.collaborators, { onDelete: 'CASCADE' })
    @JoinColumn({ name: 'list_id' })
    list: List;
  
    @Column()
    listId: string;
  
    @Field(() => User)
    @ManyToOne(() => User, { onDelete: 'CASCADE' })
    @JoinColumn({ name: 'user_id' })
    user: User;
  
    @Column()
    userId: string;
  
    @Field(() => [CollaboratorPermission])
    @Column({
      type: 'enum',
      enum: CollaboratorPermission,
      array: true,
      default: [CollaboratorPermission.VIEW]
    })
    permissions: CollaboratorPermission[];
  
    @Field(() => User)
    @ManyToOne(() => User, { onDelete: 'CASCADE' })
    @JoinColumn({ name: 'added_by_id' })
    addedBy: User;
  
    @Column()
    addedById: string;
  
    @Field()
    @CreateDateColumn()
    createdAt: Date;
  }