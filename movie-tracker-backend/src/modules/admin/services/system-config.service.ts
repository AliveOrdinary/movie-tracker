// src/modules/admin/services/system-config.service.ts
import { Injectable, NotFoundException, ConflictException, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, ILike, FindOptionsWhere } from 'typeorm';
import { SystemConfig, ConfigCategory, ConfigDataType } from '../entities/system-config.entity';
import { CreateSystemConfigInput, UpdateSystemConfigInput, SystemConfigFiltersInput } from '../dto/system-config.dto';
import { CacheService } from '../../../common/services/cache.service';
import * as crypto from 'crypto';

@Injectable()
export class SystemConfigService {
  private readonly logger = new Logger(SystemConfigService.name);
  private readonly encryptionKey: string;
  private readonly cachePrefix = 'system:config';

  constructor(
    @InjectRepository(SystemConfig)
    private configRepository: Repository<SystemConfig>,
    private readonly cacheService: CacheService,
  ) {
    // In a real production app, this should be loaded from environment variables
    // and properly managed with a secure key management solution
    this.encryptionKey = process.env.CONFIG_ENCRYPTION_KEY || 'default-encryption-key-for-development';
  }

  /**
   * Create a new system configuration item
   */
  async createConfig(input: CreateSystemConfigInput): Promise<SystemConfig> {
    try {
      // Check if config with this key already exists
      const existing = await this.configRepository.findOne({
        where: { key: input.key }
      });

      if (existing) {
        throw new ConflictException(`Configuration with key "${input.key}" already exists`);
      }

      // If encrypted, encrypt the value
      let value = input.value;
      if (input.isEncrypted) {
        value = this.encryptValue(value);
      }

      const config = this.configRepository.create({
        ...input,
        value
      });

      const savedConfig = await this.configRepository.save(config);

      // Invalidate cache
      await this.invalidateConfigCache(input.key);

      return savedConfig;
    } catch (error) {
      this.logger.error(`Error creating config: ${error.message}`, error.stack);
      throw error;
    }
  }

  /**
   * Update an existing configuration
   */
  async updateConfig(input: UpdateSystemConfigInput): Promise<SystemConfig> {
    try {
      const config = await this.configRepository.findOne({
        where: { key: input.key }
      });

      if (!config) {
        throw new NotFoundException(`Configuration with key "${input.key}" not found`);
      }

      // If encrypted, encrypt the new value
      let value = input.value;
      if (config.isEncrypted) {
        value = this.encryptValue(value);
      }

      config.value = value;
      if (input.category) {
        config.category = input.category;
      }
      if (input.description !== undefined) {
        config.description = input.description;
      }
      config.updatedAt = new Date();

      const updatedConfig = await this.configRepository.save(config);

      // Invalidate cache
      await this.invalidateConfigCache(input.key);

      return updatedConfig;
    } catch (error) {
      this.logger.error(`Error updating config: ${error.message}`, error.stack);
      throw error;
    }
  }

  /**
   * Get configuration by key
   */
  async getConfigByKey(key: string, includeEncrypted = false): Promise<SystemConfig> {
    try {
      const cacheKey = `${this.cachePrefix}:${key}`;

      return this.cacheService.getOrFetch(
        cacheKey,
        async () => {
          const config = await this.configRepository.findOne({
            where: { key }
          });

          if (!config) {
            throw new NotFoundException(`Configuration with key "${key}" not found`);
          }

          // If requested and encrypted, decrypt the value
          if (includeEncrypted && config.isEncrypted) {
            try {
              config.value = this.decryptValue(config.value);
            } catch (error) {
              this.logger.error(`Failed to decrypt config value for key ${key}`, error);
              // Return with encrypted value if decryption fails
            }
          }

          return config;
        },
        3600 // 1 hour cache
      );
    } catch (error) {
      this.logger.error(`Error getting config by key: ${error.message}`, error.stack);
      throw error;
    }
  }

  /**
   * Get configuration value by key
   */
  async getConfigValue(key: string, defaultValue: string = ''): Promise<string> {
    try {
      const config = await this.getConfigByKey(key, true);
      return config.value;
    } catch (error) {
      if (error instanceof NotFoundException) {
        return defaultValue;
      }
      this.logger.error(`Error getting config value: ${error.message}`, error.stack);
      throw error;
    }
  }

  /**
   * Get configurations by category
   */
  async getConfigsByCategory(category: ConfigCategory, includeEncrypted = false): Promise<SystemConfig[]> {
    try {
      const cacheKey = `${this.cachePrefix}:category:${category}`;

      return this.cacheService.getOrFetch(
        cacheKey,
        async () => {
          const configs = await this.configRepository.find({
            where: { category },
            order: { key: 'ASC' }
          });

          // If requested, decrypt encrypted values
          if (includeEncrypted) {
            return configs.map(config => {
              if (config.isEncrypted) {
                try {
                  config.value = this.decryptValue(config.value);
                } catch (error) {
                  this.logger.error(`Failed to decrypt config value for key ${config.key}`, error);
                  // Return with encrypted value if decryption fails
                }
              }
              return config;
            });
          }

          return configs;
        },
        3600 // 1 hour cache
      );
    } catch (error) {
      this.logger.error(`Error getting configs by category: ${error.message}`, error.stack);
      throw error;
    }
  }

  /**
   * Find configurations with filtering and pagination
   */
  async findConfigs(filters: SystemConfigFiltersInput): Promise<[SystemConfig[], number]> {
    try {
      const { category, isSystem, searchTerm, page = 1, limit = 20 } = filters;

      const where: FindOptionsWhere<SystemConfig> = {};

      if (category) {
        where.category = category;
      }

      if (typeof isSystem === 'boolean') {
        where.isSystem = isSystem;
      }

      if (searchTerm) {
        where.key = ILike(`%${searchTerm}%`);
      }

      return this.configRepository.findAndCount({
        where,
        order: { category: 'ASC', key: 'ASC' },
        skip: (page - 1) * limit,
        take: limit
      });
    } catch (error) {
      this.logger.error(`Error finding configs: ${error.message}`, error.stack);
      throw error;
    }
  }

  /**
   * Delete a configuration
   */
  async deleteConfig(key: string): Promise<boolean> {
    try {
      const config = await this.configRepository.findOne({
        where: { key }
      });

      if (!config) {
        throw new NotFoundException(`Configuration with key "${key}" not found`);
      }

      // Don't allow deletion of system configs
      if (config.isSystem) {
        throw new ConflictException(`Cannot delete system configuration "${key}"`);
      }

      await this.configRepository.remove(config);
      
      // Invalidate cache
      await this.invalidateConfigCache(key);

      return true;
    } catch (error) {
      this.logger.error(`Error deleting config: ${error.message}`, error.stack);
      throw error;
    }
  }

  /**
   * Initialize default system configurations
   */
  async initializeDefaultConfigs(): Promise<void> {
    try {
      const defaultConfigs: CreateSystemConfigInput[] = [
        {
          key: 'site.name',
          value: 'Movie Tracker',
          category: ConfigCategory.GENERAL,
          description: 'Site name displayed in title and headers',
          isEncrypted: false,
          isSystem: true,
          dataType: ConfigDataType.STRING
        },
        {
          key: 'site.description',
          value: 'Track your favorite movies and TV shows',
          category: ConfigCategory.GENERAL,
          description: 'Site meta description for SEO',
          isEncrypted: false,
          isSystem: true,
          dataType: ConfigDataType.STRING
        },
        {
          key: 'moderation.auto_approve_trusted_users',
          value: 'true',
          category: ConfigCategory.MODERATION,
          description: 'Auto-approve content from trusted users',
          isEncrypted: false,
          isSystem: true,
          dataType: ConfigDataType.BOOLEAN
        },
        {
          key: 'users.allow_registration',
          value: 'true',
          category: ConfigCategory.USERS,
          description: 'Allow new user registrations',
          isEncrypted: false,
          isSystem: true,
          dataType: ConfigDataType.BOOLEAN
        },
        {
          key: 'email.from_address',
          value: 'noreply@movietracker.com',
          category: ConfigCategory.EMAIL,
          description: 'From email address for system emails',
          isEncrypted: false,
          isSystem: true,
          dataType: ConfigDataType.EMAIL
        },
        {
          key: 'performance.cache_ttl',
          value: '3600',
          category: ConfigCategory.PERFORMANCE,
          description: 'Default cache TTL in seconds',
          isEncrypted: false,
          isSystem: true,
          dataType: ConfigDataType.INTEGER
        }
      ];

      for (const configInput of defaultConfigs) {
        try {
          // Check if config exists
          const existing = await this.configRepository.findOne({
            where: { key: configInput.key }
          });

          if (!existing) {
            await this.createConfig(configInput);
            this.logger.log(`Created default config: ${configInput.key}`);
          }
        } catch (error) {
          this.logger.error(`Failed to create default config ${configInput.key}: ${error.message}`, error.stack);
        }
      }
    } catch (error) {
      this.logger.error(`Error initializing default configs: ${error.message}`, error.stack);
      throw error;
    }
  }

  /**
   * Bulk update configs
   */
  async bulkUpdateConfigs(configs: UpdateSystemConfigInput[]): Promise<{
    successCount: number;
    failureCount: number;
    errors: string[];
  }> {
    try {
      let successCount = 0;
      let failureCount = 0;
      const errors: string[] = [];

      for (const config of configs) {
        try {
          await this.updateConfig(config);
          successCount++;
        } catch (error) {
          failureCount++;
          errors.push(`Failed to update config ${config.key}: ${error.message}`);
        }
      }

      return {
        successCount,
        failureCount,
        errors
      };
    } catch (error) {
      this.logger.error(`Error in bulk update: ${error.message}`, error.stack);
      throw error;
    }
  }

  /**
   * Get all configuration categories
   */
  getConfigCategories(): string[] {
    return Object.values(ConfigCategory);
  }

  /**
   * Export all configurations
   */
  async exportAllConfigs(includeEncrypted = false): Promise<Record<string, string>> {
    try {
      const configs = await this.configRepository.find();
      const result: Record<string, string> = {};

      for (const config of configs) {
        let value = config.value;
        if (includeEncrypted && config.isEncrypted) {
          try {
            value = this.decryptValue(value);
          } catch (error) {
            this.logger.error(`Failed to decrypt config value for key ${config.key}`, error);
          }
        }
        result[config.key] = value;
      }

      return result;
    } catch (error) {
      this.logger.error(`Error exporting configs: ${error.message}`, error.stack);
      throw error;
    }
  }

  /**
   * Import configurations
   */
  async importConfigs(configs: Record<string, string>): Promise<{
    successCount: number;
    failureCount: number;
    errors: string[];
  }> {
    try {
      let successCount = 0;
      let failureCount = 0;
      const errors: string[] = [];

      for (const [key, value] of Object.entries(configs)) {
        try {
          // Check if config exists
          const existing = await this.configRepository.findOne({
            where: { key }
          });

          if (existing) {
            // Update existing config
            const updateInput: UpdateSystemConfigInput = {
              key,
              value
            };
            await this.updateConfig(updateInput);
          } else {
            // Create new config
            const createInput: CreateSystemConfigInput = {
              key,
              value,
              category: ConfigCategory.GENERAL,
              description: `Imported configuration for ${key}`,
              isEncrypted: false,
              isSystem: false
            };
            await this.createConfig(createInput);
          }
          successCount++;
        } catch (error) {
          failureCount++;
          errors.push(`Failed to import config ${key}: ${error.message}`);
        }
      }

      return {
        successCount,
        failureCount,
        errors
      };
    } catch (error) {
      this.logger.error(`Error importing configs: ${error.message}`, error.stack);
      throw error;
    }
  }

  /**
   * Utility function to encrypt a value
   */
  private encryptValue(value: string): string {
    try {
      const iv = crypto.randomBytes(16);
      const cipher = crypto.createCipheriv(
        'aes-256-cbc',
        Buffer.from(this.encryptionKey.padEnd(32).slice(0, 32)),
        iv
      );
      let encrypted = cipher.update(value, 'utf8', 'base64');
      encrypted += cipher.final('base64');
      return `${iv.toString('base64')}:${encrypted}`;
    } catch (error) {
      this.logger.error('Failed to encrypt value', error);
      throw new Error('Failed to encrypt configuration value');
    }
  }

  /**
   * Utility function to decrypt a value
   */
  private decryptValue(encryptedValue: string): string {
    try {
      const [ivBase64, encryptedText] = encryptedValue.split(':');
      const iv = Buffer.from(ivBase64, 'base64');
      const decipher = crypto.createDecipheriv(
        'aes-256-cbc',
        Buffer.from(this.encryptionKey.padEnd(32).slice(0, 32)),
        iv
      );
      let decrypted = decipher.update(encryptedText, 'base64', 'utf8');
      decrypted += decipher.final('utf8');
      return decrypted;
    } catch (error) {
      this.logger.error('Failed to decrypt value', error);
      throw new Error('Failed to decrypt configuration value');
    }
  }

  /**
   * Invalidate cache for a specific config key and related keys
   */
  private async invalidateConfigCache(key: string): Promise<void> {
    try {
      // Get the category for this key to invalidate category cache
      const config = await this.configRepository.findOne({
        where: { key },
        select: ['category']
      });
      
      const keysToInvalidate = [`${this.cachePrefix}:${key}`];
      
      if (config?.category) {
        keysToInvalidate.push(`${this.cachePrefix}:category:${config.category}`);
      }
      
      await this.cacheService.invalidateMultiple(keysToInvalidate);
      
      // Also invalidate the all-configs cache if it exists (used for exports)
      await this.cacheService.invalidatePattern(`${this.cachePrefix}:all`);
    } catch (error) {
      this.logger.error(`Error invalidating config cache for ${key}: ${error.message}`, error.stack);
    }
  }
}