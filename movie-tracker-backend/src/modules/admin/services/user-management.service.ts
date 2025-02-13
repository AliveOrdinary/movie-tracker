// src/modules/admin/services/user-management.service.ts
import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from '../../users/entities/user.entity';
import { UserRole } from '../../../common/enums/roles.enum';

@Injectable()
export class UserManagementService {
  constructor(
    @InjectRepository(User)
    private userRepository: Repository<User>,
  ) {}

  async banUser(userId: string, reason: string): Promise<User> {
    const user = await this.userRepository.findOne({ where: { id: userId } });
    if (!user) {
      throw new NotFoundException(`User with ID ${userId} not found`);
    }

    // Don't allow banning admins
    if (user.roles.includes(UserRole.ADMIN)) {
      throw new ForbiddenException('Cannot ban administrators');
    }

    user.isBanned = true;
    user.banReason = reason || 'No reason provided';
    user.bannedAt = new Date();

    return this.userRepository.save(user);
  }

  async unbanUser(userId: string): Promise<User> {
    const user = await this.userRepository.findOne({ where: { id: userId } });
    if (!user) {
      throw new NotFoundException(`User with ID ${userId} not found`);
    }

    user.isBanned = false;
    user.banReason = undefined;
    user.bannedAt = undefined;

    return this.userRepository.save(user);
  }

  async updateUserRole(userId: string, role: UserRole): Promise<User> {
    const user = await this.userRepository.findOne({ where: { id: userId } });
    if (!user) {
      throw new NotFoundException(`User with ID ${userId} not found`);
    }

    if (!user.roles.includes(role)) {
      user.roles = [...user.roles, role];
    }

    return this.userRepository.save(user);
  }

  async getAllUsers(page = 1, limit = 10): Promise<{
    users: User[];
    total: number;
    page: number;
    totalPages: number;
  }> {
    const [users, total] = await this.userRepository.findAndCount({
      skip: (page - 1) * limit,
      take: limit,
      order: { createdAt: 'DESC' },
    });

    return {
      users,
      total,
      page,
      totalPages: Math.ceil(total / limit),
    };
  }

  async searchUsers(query: string, page = 1, limit = 10): Promise<{
    users: User[];
    total: number;
    page: number;
    totalPages: number;
  }> {
    const [users, total] = await this.userRepository.findAndCount({
      where: [
        { username: query },
        { email: query },
      ],
      skip: (page - 1) * limit,
      take: limit,
    });

    return {
      users,
      total,
      page,
      totalPages: Math.ceil(total / limit),
    };
  }
}