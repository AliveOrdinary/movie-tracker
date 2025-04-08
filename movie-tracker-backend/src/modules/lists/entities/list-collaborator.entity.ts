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
  import { ObjectType, Field, ID } from '@nestjs/graphql';
  import { List } from './list.entity';
  import { User } from '../../users/entities/user.entity';
import { CollaboratorPermission } from '../../../common/enums';
  
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
  
    @Column({ name: 'list_id' }) listId: string;
  
    @Field(() => User)
    @ManyToOne(() => User, { onDelete: 'CASCADE' })
    @JoinColumn({ name: 'user_id' })
    user: User;
  
    @Column({ name: 'user_id' }) userId: string;
  
    @Field(() => [CollaboratorPermission])
    @Column({ 
      type: 'enum',
      enum: CollaboratorPermission,
      array: true,
      default: [CollaboratorPermission.VIEW],
      name: 'permissions' // Keep DB column name, but use uppercase TypeScript enum
    }) 
    permissions: CollaboratorPermission[];
  
    @Field(() => User)
    @ManyToOne(() => User, { onDelete: 'CASCADE' })
    @JoinColumn({ name: 'added_by_id' })
    addedBy: User;
  
    @Column({ name: 'added_by_id' }) addedById: string;
  
    @Field()
    @CreateDateColumn({ name: 'created_at' }) createdAt: Date;
  }