//src/modules/moderation/entities/report.entity.ts
import { ObjectType, Field, ID } from '@nestjs/graphql';
import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, CreateDateColumn } from 'typeorm';
import { Review } from '../../reviews/entities/review.entity';

@ObjectType()
@Entity('reports')
export class Report {
  @Field(() => ID)
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Field(() => Review)
  @ManyToOne(() => Review)
  review: Review;

  @Field()
  @Column()
  reason: string;

  @Field()
  @Column()
  status: string;

  @Field({ nullable: true })
  @Column({ nullable: true })
  resolution?: string;

  @Field(() => Date)
  @CreateDateColumn()
  createdAt: Date;
}