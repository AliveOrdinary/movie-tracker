// src/modules/lists/entities/list-favorite.entity.ts
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
  
  @ObjectType()
  @Entity('list_favorites')
  @Unique(['listId', 'userId'])
  @Index(['userId', 'createdAt'])
  export class ListFavorite {
    @Field(() => ID)
    @PrimaryGeneratedColumn('uuid')
    id: string;
  
    @Field(() => List)
    @ManyToOne(() => List, { onDelete: 'CASCADE' })
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
  
    @Field()
    @CreateDateColumn()
    createdAt: Date;
  }