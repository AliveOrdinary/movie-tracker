// src/modules/users/users.service.ts
import { Injectable, NotFoundException, ConflictException, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Not } from 'typeorm';
import { User } from './entities/user.entity';
import { CreateUserInput, UpdateUserInput } from './dto';
import { UserRole, ProfileVisibility, WatchlistDisplayMode, ActivityFeedFilter, ReviewsSortOrder } from 'src/common/enums';
import { BaseService } from '../../common/services/base.service';
import { CacheService } from '../../common/services/cache.service';

@Injectable()
export class UsersService extends BaseService<User> {
  protected readonly logger = new Logger(UsersService.name);
  private readonly cachePrefix = 'user';

  constructor(
    @InjectRepository(User)
    protected readonly userRepository: Repository<User>,
    protected readonly cacheService: CacheService,
  ) {
    super(userRepository, cacheService, 'user');
  }

  async create(input: CreateUserInput): Promise<User> {
    try {
      const existingUser = await this.userRepository.findOne({
        where: [{ email: input.email }, { username: input.username }],
      });

      if (existingUser) {
        throw new ConflictException('Email or username already exists');
      }

      const user = this.userRepository.create(input);
      const saved = await this.userRepository.save(user);
      await this.clearEntityCache(saved.id);
      return saved;
    } catch (error) {
      this.logger.error(`Error creating user: ${error.message}`, error.stack);
      throw error;
    }
  }

  async createFirebaseUser(input: {
    firebaseUid: string;
    email: string;
    displayName: string;
    avatarUrl?: string;
  }): Promise<User> {
    try {
      // Check if user with this Firebase UID already exists
      const existingUser = await this.findByFirebaseUid(input.firebaseUid);
      if (existingUser) {
        return existingUser;
      }

      this.logger.log(`Creating user with roles: ${UserRole.USER}`);
      
      // Ensure all enum values are uppercase
      const user = this.userRepository.create({
        ...input,
        username: input.displayName,
        roles: [UserRole.USER], // This should be uppercase 'USER'
        avatarUrl: input.avatarUrl || undefined,
        // Set default enum values explicitly to uppercase
        profileVisibility: ProfileVisibility.PUBLIC,
        watchlistDisplayMode: WatchlistDisplayMode.GRID,
        activityFeedFilter: ActivityFeedFilter.ALL,
        reviewsSortOrder: ReviewsSortOrder.LATEST
      });
      
      // Log to verify role capitalization
      this.logger.log(`Created user with roles: ${JSON.stringify(user.roles)}`);
      this.logger.log(`User enum values: profileVisibility=${user.profileVisibility}, watchlistDisplayMode=${user.watchlistDisplayMode}`);
      
      const saved = await this.userRepository.save(user);
      await this.clearUserCache(saved.id, saved);
      return saved;
    } catch (error) {
      this.logger.error(`Error creating Firebase user: ${error.message}`, error.stack);
      throw error;
    }
  }

  async findAll(): Promise<User[]> {
    try {
      return this.userRepository.find();
    } catch (error) {
      this.logger.error(`Error finding all users: ${error.message}`, error.stack);
      throw error;
    }
  }

  async findOne(id: string, relations: string[] = []): Promise<User> {
    try {
      const cacheKey = `${this.cachePrefix}:id:${id}`;
      
      return this.cacheService.getOrFetch(
        cacheKey,
        async () => {
          const user = await this.userRepository.findOne({
            where: { id },
            relations
          });

          if (!user) {
            throw new NotFoundException(`User with ID ${id} not found`);
          }

          return user;
        },
        3600 // Cache for 1 hour
      );
    } catch (error) {
      this.logger.error(`Error finding user by ID ${id}: ${error.message}`, error.stack);
      throw error;
    }
  }

  async findByEmail(email: string): Promise<User | null> {
    try {
      const cacheKey = `${this.cachePrefix}:email:${email}`;
      return this.cacheService.getOrFetch(
        cacheKey,
        async () => {
          const user = await this.userRepository.findOne({ 
            where: { email } 
          });
          return user;
        },
        3600 // Cache for 1 hour
      );
    } catch (error) {
      this.logger.error(`Error finding user by email ${email}: ${error.message}`, error.stack);
      return null;
    }
  }

  async findByFirebaseUid(firebaseUid: string): Promise<User | null> {
    this.logger.log(`Finding user by Firebase UID: ${firebaseUid}`);
    try {
      const cacheKey = `${this.cachePrefix}:firebase:${firebaseUid}`;
      return this.cacheService.getOrFetch(
        cacheKey,
        async () => {
          const user = await this.userRepository.findOne({
            where: { firebaseUid }
          });

          if (user) {
            // Ensure dates are properly instantiated
            user.createdAt = new Date(user.createdAt);
            user.updatedAt = new Date(user.updatedAt);
            if (user.lastLoginAt) user.lastLoginAt = new Date(user.lastLoginAt);
            if (user.lastActivityAt) user.lastActivityAt = new Date(user.lastActivityAt);
            if (user.bannedAt) user.bannedAt = new Date(user.bannedAt);
            if (user.suspendedUntil) user.suspendedUntil = new Date(user.suspendedUntil);
            if (user.lastWarningAt) user.lastWarningAt = new Date(user.lastWarningAt);
          }

          return user;
        },
        3600 // Cache for 1 hour
      );
    } catch (error) {
      this.logger.error(`Error finding user by Firebase UID ${firebaseUid}: ${error.message}`, error.stack);
      return null;
    }
  }

  async findByUsername(username: string): Promise<User | null> {
    try {
      const cacheKey = `${this.cachePrefix}:username:${username}`;
      return this.cacheService.getOrFetch(
        cacheKey,
        async () => {
          const user = await this.userRepository.findOne({ 
            where: { username } 
          });
          return user;
        },
        3600 // Cache for 1 hour
      );
    } catch (error) {
      this.logger.error(`Error finding user by username ${username}: ${error.message}`, error.stack);
      return null;
    }
  }

  async update(id: string, input: UpdateUserInput): Promise<User> {
    try {
      // First find the user to make sure it exists
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

      // Update the user in the database
      const updatedFields = { ...input };
      if (input.lastActivityAt) {
        updatedFields.lastActivityAt = new Date(input.lastActivityAt);
      }
      
      await this.userRepository.update(id, updatedFields);
      
      // Clear cache for this user
      const updatedUser = { ...user, ...updatedFields };
      await this.clearUserCache(id, updatedUser);
      
      // Return the updated user
      return this.findOne(id);
    } catch (error) {
      this.logger.error(`Error updating user ${id}: ${error.message}`, error.stack);
      throw error;
    }
  }

  async remove(id: string): Promise<boolean> {
    try {
      const user = await this.findOne(id);
      await this.userRepository.remove(user);
      await this.clearUserCache(id, user);
      return true;
    } catch (error) {
      this.logger.error(`Error removing user ${id}: ${error.message}`, error.stack);
      throw error;
    }
  }

  async updateLastLogin(id: string): Promise<void> {
    try {
      await this.userRepository.update(id, {
        lastLoginAt: new Date(),
      });
      
      // Get the user to properly invalidate cache
      const user = await this.findOne(id);
      await this.clearUserCache(id, user);
    } catch (error) {
      this.logger.error(`Error updating last login for user ${id}: ${error.message}`, error.stack);
      throw error;
    }
  }

  // User ban management
  async banUser(id: string, reason: string): Promise<User> {
    try {
      const user = await this.findOne(id);
      user.isBanned = true;
      user.banReason = reason;
      user.bannedAt = new Date();
      const updated = await this.userRepository.save(user);
      await this.clearUserCache(id, updated);
      return updated;
    } catch (error) {
      this.logger.error(`Error banning user ${id}: ${error.message}`, error.stack);
      throw error;
    }
  }

  async unbanUser(id: string): Promise<User> {
    try {
      const user = await this.findOne(id);
      user.isBanned = false;
      user.banReason = undefined;
      user.bannedAt = undefined;
      const updated = await this.userRepository.save(user);
      await this.clearUserCache(id, updated);
      return updated;
    } catch (error) {
      this.logger.error(`Error unbanning user ${id}: ${error.message}`, error.stack);
      throw error;
    }
  }

  // Warning system
  async warnUser(id: string, reason: string): Promise<User> {
    try {
      const user = await this.findOne(id);
      user.warningCount = (user.warningCount || 0) + 1;
      user.lastWarningReason = reason;
      user.lastWarningAt = new Date();
      const updated = await this.userRepository.save(user);
      await this.clearUserCache(id, updated);
      return updated;
    } catch (error) {
      this.logger.error(`Error warning user ${id}: ${error.message}`, error.stack);
      throw error;
    }
  }

  async clearWarnings(id: string): Promise<User> {
    try {
      const user = await this.findOne(id);
      user.warningCount = 0;
      user.lastWarningReason = undefined;
      user.lastWarningAt = undefined;
      const updated = await this.userRepository.save(user);
      await this.clearUserCache(id, updated);
      return updated;
    } catch (error) {
      this.logger.error(`Error clearing warnings for user ${id}: ${error.message}`, error.stack);
      throw error;
    }
  }

  // Role management
  async updateRole(id: string, role: UserRole): Promise<User> {
    try {
      const user = await this.findOne(id);
      if (!user.roles.includes(role)) {
        user.roles = [...user.roles, role];
      }
      const updated = await this.userRepository.save(user);
      await this.clearUserCache(id, updated);
      return updated;
    } catch (error) {
      this.logger.error(`Error updating role for user ${id}: ${error.message}`, error.stack);
      throw error;
    }
  }

  async removeRole(id: string, role: UserRole): Promise<User> {
    try {
      const user = await this.findOne(id);
      user.roles = user.roles.filter(r => r !== role);
      const updated = await this.userRepository.save(user);
      await this.clearUserCache(id, updated);
      return updated;
    } catch (error) {
      this.logger.error(`Error removing role for user ${id}: ${error.message}`, error.stack);
      throw error;
    }
  }

  // Helper to clear all user-related cache entries
  private async clearUserCache(id: string, user?: User): Promise<void> {
    try {
      // Clear cache by ID
      await this.cacheService.invalidate(`${this.cachePrefix}:id:${id}`);
      
      // Clear additional user identifiers if we have the user object
      if (user) {
        if (user.email) {
          await this.cacheService.invalidate(`${this.cachePrefix}:email:${user.email}`);
        }
        if (user.username) {
          await this.cacheService.invalidate(`${this.cachePrefix}:username:${user.username}`);
        }
        if (user.firebaseUid) {
          await this.cacheService.invalidate(`${this.cachePrefix}:firebase:${user.firebaseUid}`);
        }
      } else {
        // If user object not provided, try to get it
        try {
          const userData = await this.userRepository.findOne({
            where: { id },
            select: ['email', 'username', 'firebaseUid']
          });
          
          if (userData) {
            if (userData.email) {
              await this.cacheService.invalidate(`${this.cachePrefix}:email:${userData.email}`);
            }
            if (userData.username) {
              await this.cacheService.invalidate(`${this.cachePrefix}:username:${userData.username}`);
            }
            if (userData.firebaseUid) {
              await this.cacheService.invalidate(`${this.cachePrefix}:firebase:${userData.firebaseUid}`);
            }
          }
        } catch (error) {
          this.logger.error(`Error getting user data for cache invalidation: ${error.message}`, error.stack);
        }
      }
    } catch (error) {
      this.logger.error(`Error clearing user cache for ${id}: ${error.message}`, error.stack);
    }
  }
}