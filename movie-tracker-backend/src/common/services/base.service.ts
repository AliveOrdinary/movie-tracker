// src/common/services/base.service.ts
import { Repository, FindOptionsWhere, FindOneOptions, DeepPartial, In  } from 'typeorm';
import { Injectable, NotFoundException, Logger } from '@nestjs/common';
import { CacheService } from './cache.service';
import { CacheKeyFactory } from '../factories/cache-key.factory';
import { CacheTTL } from '../constants/cache-ttl.constants';

@Injectable()
export abstract class BaseService<T extends { id: string }> {
  protected readonly logger = new Logger(BaseService.name);

  constructor(
    protected readonly repository: Repository<T>,
    protected readonly cacheService: CacheService,
    protected readonly entityName: string,
    protected readonly cacheKeyFactory?: CacheKeyFactory
  ) {}

  /**
   * Find multiple entities by their IDs
   * @param ids Array of entity IDs
   * @param relations Optional relations to load
   * @returns Array of found entities
   */
  async findByIds(ids: string[], relations: string[] = []): Promise<T[]> {
    try {
      const cacheKeys = ids.map(id => this.getEntityCacheKey(id));
      const cachedEntities = await this.cacheService.mget<T>(cacheKeys);
      
      const missingIds = ids.filter((id, index) => !cachedEntities[index]);
      
      if (missingIds.length > 0) {
        const entities = await this.repository.find({
          where: { id: In(missingIds) } as FindOptionsWhere<T>,
          relations
        });
        
        // Cache found entities
        await this.cacheService.mset(
          entities.map(entity => ({
            key: this.getEntityCacheKey(entity.id),
            value: entity,
            ttl: CacheTTL.MEDIUM
          }))
        );
        
        // Merge cached and fetched entities
        return ids.map(id => {
          const cachedEntity = cachedEntities[ids.indexOf(id)];
          if (cachedEntity) return cachedEntity;
          return entities.find(e => e.id === id);
        }).filter(Boolean) as T[];
      }
      
      return cachedEntities.filter(Boolean) as T[];
    } catch (error) {
      this.logger.error(`Error finding entities by IDs: ${error.message}`, error.stack);
      // If cache fails, fallback to direct database query
      return this.repository.find({
        where: { id: In(ids) } as FindOptionsWhere<T>,
        relations
      });
    }
  }

  /**
   * Create multiple entities at once
   * @param data Array of entity data
   * @returns Created entities
   */
  async createMany(data: DeepPartial<T>[]): Promise<T[]> {
    try {
      const entities = this.repository.create(data);
      const savedEntities = await this.repository.save(entities);
      
      // Cache created entities
      await this.cacheService.mset(
        savedEntities.map(entity => ({
          key: this.getEntityCacheKey(entity.id),
          value: entity,
          ttl: CacheTTL.MEDIUM
        }))
      );
      
      return savedEntities as T[];
    } catch (error) {
      this.logger.error(`Error creating multiple entities: ${error.message}`, error.stack);
      throw error;
    }
  }

  /**
   * Update multiple entities at once
   * @param updates Array of entity updates
   * @returns Updated entities
   */
  async updateMany(
    updates: { id: string; data: DeepPartial<T> }[]
  ): Promise<T[]> {
    try {
      const result: T[] = [];
      
      for (const update of updates) {
        const entity = await this.findOne(update.id);
        Object.assign(entity, update.data);
        result.push(await this.repository.save(entity));
      }
      
      // Update cache
      await this.cacheService.mset(
        result.map(entity => ({
          key: this.getEntityCacheKey(entity.id),
          value: entity,
          ttl: CacheTTL.MEDIUM
        }))
      );
      
      return result as T[];
    } catch (error) {
      this.logger.error(`Error updating multiple entities: ${error.message}`, error.stack);
      throw error;
    }
  }

  /**
   * Delete multiple entities by their IDs
   * @param ids Array of entity IDs
   * @returns Success indicator
   */
  async deleteMany(ids: string[]): Promise<boolean> {
    try {
      await this.repository.delete(ids);
      
      // Invalidate cache
      await this.cacheService.invalidateMultiple(
        ids.map(id => this.getEntityCacheKey(id))
      );
      
      return true;
    } catch (error) {
      this.logger.error(`Error deleting multiple entities: ${error.message}`, error.stack);
      throw error;
    }
  }

  /**
   * Refresh cache for an entity
   * @param id Entity ID
   */
  async refreshCache(id: string): Promise<void> {
    try {
      const entity = await this.repository.findOne({
        where: { id } as FindOptionsWhere<T>
      });
      
      if (entity) {
        await this.cacheService.set(this.getEntityCacheKey(id), entity, CacheTTL.MEDIUM);
      } else {
        await this.cacheService.invalidate(this.getEntityCacheKey(id));
      }
    } catch (error) {
      this.logger.error(`Error refreshing cache for entity ${id}: ${error.message}`, error.stack);
    }
  }

  /**
   * Find an entity by ID
   * @param id Entity ID
   * @param relations Optional relations to load
   * @returns Found entity
   */
  async findOne(id: string, relations: string[] = []): Promise<T> {
    return this.findCached(id, relations);
  }

  /**
   * Find all entities of this type
   * @param relations Optional relations to load
   * @returns All entities
   */
  async findAll(relations: string[] = []): Promise<T[]> {
    try {
      return this.repository.find({ relations });
    } catch (error) {
      this.logger.error(`Error finding all entities: ${error.message}`, error.stack);
      throw error;
    }
  }

  /**
   * Create a new entity
   * @param data Entity data
   * @returns Created entity
   */
  async create(data: DeepPartial<T>): Promise<T> {
    try {
      const entity = this.repository.create(data);
      const saved = await this.repository.save(entity);
      await this.clearEntityCache(saved.id);
      return saved;
    } catch (error) {
      this.logger.error(`Error creating entity: ${error.message}`, error.stack);
      throw error;
    }
  }

  /**
   * Update an entity
   * @param id Entity ID
   * @param data New entity data
   * @returns Updated entity
   */
  async update(id: string, data: DeepPartial<T>): Promise<T> {
    try {
      await this.repository.update(id, data as any);
      await this.clearEntityCache(id);
      return this.findOne(id);
    } catch (error) {
      this.logger.error(`Error updating entity ${id}: ${error.message}`, error.stack);
      throw error;
    }
  }

  /**
   * Delete an entity
   * @param id Entity ID
   * @returns Success indicator
   */
  async delete(id: string): Promise<boolean> {
    try {
      const result = await this.repository.delete(id);
      await this.clearEntityCache(id);
      return result.affected ? true : false;
    } catch (error) {
      this.logger.error(`Error deleting entity ${id}: ${error.message}`, error.stack);
      throw error;
    }
  }

  /**
   * Get paginated entities
   * @param page Page number
   * @param limit Items per page
   * @param relations Optional relations to load
   * @returns Paginated entities and count
   */
  async paginate(page = 1, limit = 10, relations: string[] = []): Promise<[T[], number]> {
    try {
      return this.repository.findAndCount({
        relations,
        skip: (page - 1) * limit,
        take: limit,
      });
    } catch (error) {
      this.logger.error(`Error paginating entities: ${error.message}`, error.stack);
      throw error;
    }
  }

  /**
   * Find an entity from cache or database
   * @param id Entity ID
   * @param relations Optional relations to load
   * @returns Found entity
   */
  protected async findCached(
    id: string,
    relations: string[] = []
  ): Promise<T> {
    try {
      const cacheKey = this.getEntityCacheKey(id);
      
      return this.cacheService.getOrFetch(
        cacheKey,
        async () => {
          const entity = await this.repository.findOne({
            where: { id } as FindOptionsWhere<T>,
            relations
          });

          if (!entity) {
            throw new NotFoundException(`${this.entityName} with ID ${id} not found`);
          }

          return entity;
        },
        CacheTTL.MEDIUM
      );
    } catch (error) {
      if (error instanceof NotFoundException) throw error;
      
      this.logger.error(`Error finding cached entity ${id}: ${error.message}`, error.stack);
      
      // Fallback to direct DB query
      const result = await this.repository.findOne({
        where: { id } as FindOptionsWhere<T>,
        relations
      });
      
      if (!result) {
        throw new NotFoundException(`${this.entityName} with ID ${id} not found`);
      }
      
      return result;
    }
  }

  /**
   * Clear cache for an entity
   * @param id Entity ID
   */
  protected async clearEntityCache(id: string): Promise<void> {
    try {
      // Clear individual entity
      await this.cacheService.invalidate(this.getEntityCacheKey(id));
      
      // Also clear any lists of this entity type
      await this.cacheService.invalidatePattern(`${this.entityName}:list`);
    } catch (error) {
      this.logger.error(`Error clearing entity cache for ${id}: ${error.message}`, error.stack);
    }
  }

  /**
   * Generate a consistent cache key for an entity
   * @param id Entity ID
   * @returns Formatted cache key
   */
  protected getEntityCacheKey(id: string): string {
    return this.cacheKeyFactory
      ? this.cacheKeyFactory.generate(this.entityName, 'id', [id])
      : `${this.entityName}:id:${id}`;
  }
}