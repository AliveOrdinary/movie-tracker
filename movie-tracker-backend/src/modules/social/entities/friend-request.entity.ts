// src/modules/social/entities/friend-request.entity.ts
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

export enum FriendRequestStatus {
  PENDING = 'PENDING',
  ACCEPTED = 'ACCEPTED',
  REJECTED = 'REJECTED',
  CANCELED = 'CANCELED'
}

registerEnumType(FriendRequestStatus, {
  name: '_friend_request_status',
  description: 'Status of a friend request',
});

@ObjectType()
@Entity('friend_requests')
@Unique(['sender_id', 'recipient_id'])
@Index(['sender_id', 'recipient_id', 'status'])
export class FriendRequest {
  @Field(() => ID)
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Field(() => User)
  @ManyToOne(() => User, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'sender_id' })
  sender: User;

  @Column({ name: 'sender_id'  }) sender_id: string;

  @Field(() => User)
  @ManyToOne(() => User, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'recipient_id' })
  recipient: User;

  @Column({ name: 'recipient_id'  }) recipient_id: string;

  @Field(() => FriendRequestStatus)
  @Column({ type: 'enum',
    enum: FriendRequestStatus,
    default: FriendRequestStatus.PENDING
  , name: 'status' }) status: FriendRequestStatus;

  @Field({ nullable: true })
  @Column({ nullable: true })
  message?: string;

  @Field()
  @CreateDateColumn({ name: 'created_at' }) createdAt: Date;

  @Field()
  @UpdateDateColumn({ name: 'updated_at' }) updatedAt: Date;
}
