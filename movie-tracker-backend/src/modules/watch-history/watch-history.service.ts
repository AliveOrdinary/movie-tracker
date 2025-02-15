// src/modules/watch-history/watch-history.service.ts
import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { WatchHistory, WatchType } from './entities/watch-history.entity';
import { CreateWatchInput } from './dto/create-watch.input';
import { UpdateWatchInput } from './dto/update-watch.input';
import { User } from '../users/entities/user.entity';

@Injectable()
export class WatchHistoryService {
  constructor(
    @InjectRepository(WatchHistory)
    private watchHistoryRepository: Repository<WatchHistory>,
  ) {}

  async create(createWatchDto: CreateWatchInput & { userId: string }): Promise<WatchHistory> {
    const watch = this.watchHistoryRepository.create({
      ...createWatchDto,
      user: { id: createWatchDto.userId },
      movie: { id: createWatchDto.movieId }
    });
    return this.watchHistoryRepository.save(watch);
  }

  async findByMovieAndUser(movieId: string, userId: string): Promise<WatchHistory | null> {
    return this.watchHistoryRepository.findOne({
      where: {
        movie: { id: movieId },
        user: { id: userId }
      },
      relations: ['movie', 'user'],
      order: { watchedAt: 'DESC' }
    });
  }

  async findOne(id: string, user: User): Promise<WatchHistory> {
    const watch = await this.watchHistoryRepository.findOne({
      where: { id, user: { id: user.id } },
      relations: ['movie', 'user']
    });

    if (!watch) {
      throw new NotFoundException(`Watch history entry with ID ${id} not found`);
    }

    return watch;
  }

  async update(id: string, updateWatchDto: UpdateWatchInput): Promise<WatchHistory> {
    const watch = await this.watchHistoryRepository.preload({
      id,
      ...updateWatchDto,
    });

    if (!watch) {
      throw new NotFoundException(`Watch history entry with ID ${id} not found`);
    }

    return this.watchHistoryRepository.save(watch);
  }

  async remove(id: string): Promise<boolean> {
    const result = await this.watchHistoryRepository.delete(id);
    return result.affected ? true : false;
  }

  async getUserWatchHistory(userId: string, page = 1, limit = 10): Promise<[WatchHistory[], number]> {
    return this.watchHistoryRepository.findAndCount({
      where: { user: { id: userId } },
      relations: ['movie'],
      order: { watchedAt: 'DESC' },
      skip: (page - 1) * limit,
      take: limit
    });
  }

  async getStats(userId: string) {
    const watches = await this.watchHistoryRepository.find({
      where: { user: { id: userId } },
      relations: ['movie']
    });

    const totalWatch = watches.length;
    const uniqueMovies = new Set(watches.map(w => w.movie.id)).size;
    const totalWatchTime = watches.reduce((sum, w) => sum + (w.movie.runtime || 0), 0);
    const averageRating = watches.reduce((sum, w) => sum + (w.rating || 0), 0) / watches.length || 0;

    return {
      totalWatch,
      uniqueMovies,
      totalWatchTime,
      averageRating
    };
  }
}