//src/modules/users/users.module.ts
import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { UsersService } from './users.service';
import { UsersResolver } from './users.resolver';
import { User } from './entities/user.entity';
import { FirebaseModule } from '../../firebase/firebase.module';
import { FirebaseStorageModule } from '../storage/firebase-storage.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([User]),
    FirebaseModule,
    FirebaseStorageModule,
  ],
  providers: [UsersResolver, UsersService],
  exports: [UsersService],
})
export class UsersModule {}
