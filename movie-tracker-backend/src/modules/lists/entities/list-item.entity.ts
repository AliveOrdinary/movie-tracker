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
  import { Movie } from '../../movies/entities/movie.entity';
  
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
  
    @Column({ name: 'list_id' }) listId: string;
  
    @Field(() => Movie)
    @ManyToOne(() => Movie)
  @JoinColumn({ name: 'movie_id' })
  movie: Movie;

  @Column({ name: 'movie_id' }) 
  movieId: string;
  
    @Field(() => User)
    @ManyToOne(() => User, { onDelete: 'CASCADE' })
    @JoinColumn({ name: 'added_by_id' })
    addedBy: User;
  
    @Column({ name: 'added_by_id' }) addedById: string;
  
    @Field(() => Number)
    @Column({ default: 0 })
    order: number;
  
    @Field()
    @CreateDateColumn({ name: 'created_at' }) createdAt: Date;
  }