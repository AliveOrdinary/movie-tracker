// src/modules/lists/entities/list-item.entity.ts
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
  @Entity('list_items')
  @Unique(['listId', 'movieId'])
  @Index(['listId', 'createdAt'])
  export class ListItem {
    @Field(() => ID)
    @PrimaryGeneratedColumn('uuid')
    id: string;
  
    @Field(() => List)
    @ManyToOne(() => List, list => list.items, { onDelete: 'CASCADE' })
    @JoinColumn({ name: 'list_id' })
    list: List;
  
    @Column()
    listId: string;
  
    @Field(() => Number)
    @Column()
    movieId: number;
  
    @Field(() => User)
    @ManyToOne(() => User, { onDelete: 'CASCADE' })
    @JoinColumn({ name: 'added_by_id' })
    addedBy: User;
  
    @Column()
    addedById: string;
  
    @Field(() => Number)
    @Column({ default: 0 })
    order: number;
  
    @Field()
    @CreateDateColumn()
    createdAt: Date;
  }