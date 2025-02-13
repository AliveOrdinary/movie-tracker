// src/modules/users/users.service.ts
import { Injectable, NotFoundException, ConflictException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Not } from 'typeorm';
import { User } from './entities/user.entity';
import { CreateUserInput, UpdateUserInput } from './dto';
import { UserRole } from '../../common/enums/roles.enum';

@Injectable()
export class UsersService {
  constructor(
    @InjectRepository(User)
    private readonly userRepository: Repository<User>
  ) {}

  async create(input: CreateUserInput): Promise<User> {
    const existingUser = await this.userRepository.findOne({
      where: [{ email: input.email }, { username: input.username }],
    });

    if (existingUser) {
      throw new ConflictException('Email or username already exists');
    }

    const user = this.userRepository.create(input);
    return await this.userRepository.save(user);
  }

  async createFirebaseUser(input: {
    firebaseUid: string;
    email: string;
    displayName: string;
  }): Promise<User> {
    const user = this.userRepository.create({
      ...input,
      username: input.displayName,
      roles: [UserRole.USER],
    });
    return await this.userRepository.save(user);
  }

  async findAll(): Promise<User[]> {
    return this.userRepository.find();
  }

  async findOne(id: string): Promise<User> {
    const user = await this.userRepository.findOne({
      where: { id },
      relations: ['reviews'],
    });

    if (!user) {
      throw new NotFoundException(`User with ID ${id} not found`);
    }

    return user;
  }

  async findByEmail(email: string): Promise<User | null> {
    return this.userRepository.findOne({ where: { email } });
  }

  async findByFirebaseUid(firebaseUid: string): Promise<User | null> {
    return this.userRepository.findOne({ where: { firebaseUid } });
  }

  async findByUsername(username: string): Promise<User | null> {
    return this.userRepository.findOne({ where: { username } });
  }

  async update(id: string, input: UpdateUserInput): Promise<User> {
    const user = await this.findOne(id);

    // If updating email or username, check for conflicts
    if (input.email || input.username) {
      const existingUser = await this.userRepository.findOne({
        where: [
          { email: input.email, id: Not(id) },
          { username: input.username, id: Not(id) },
        ],
      });

      if (existingUser) {
        throw new ConflictException('Email or username already exists');
      }
    }

    Object.assign(user, input);
    return await this.userRepository.save(user);
  }

  async remove(id: string): Promise<boolean> {
    const user = await this.findOne(id);
    await this.userRepository.remove(user);
    return true;
  }

  async updateLastLogin(id: string): Promise<void> {
    await this.userRepository.update(id, {
      lastLoginAt: new Date(),
    });
  }

  // User ban management
  async banUser(id: string, reason: string): Promise<User> {
    const user = await this.findOne(id);
    user.isBanned = true;
    user.banReason = reason;
    user.bannedAt = new Date();
    return await this.userRepository.save(user);
  }

  async unbanUser(id: string): Promise<User> {
    const user = await this.findOne(id);
    user.isBanned = false;
    user.banReason = undefined;
    user.bannedAt = undefined;
    return await this.userRepository.save(user);
  }

  // Warning system
  async warnUser(id: string, reason: string): Promise<User> {
    const user = await this.findOne(id);
    user.warningCount = (user.warningCount || 0) + 1;
    user.lastWarningReason = reason;
    user.lastWarningAt = new Date();
    return await this.userRepository.save(user);
  }

  async clearWarnings(id: string): Promise<User> {
    const user = await this.findOne(id);
    user.warningCount = 0;
    user.lastWarningReason = undefined;
    user.lastWarningAt = undefined;
    return await this.userRepository.save(user);
  }

  // Role management
  async updateRole(id: string, role: UserRole): Promise<User> {
    const user = await this.findOne(id);
    if (!user.roles.includes(role)) {
      user.roles = [...user.roles, role];
    }
    return await this.userRepository.save(user);
  }

  async removeRole(id: string, role: UserRole): Promise<User> {
    const user = await this.findOne(id);
    user.roles = user.roles.filter(r => r !== role);
    return await this.userRepository.save(user);
  }
}