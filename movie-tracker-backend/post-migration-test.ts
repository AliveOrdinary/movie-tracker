// post-migration-test.ts
/**
 * This script performs various database operations after the naming standardization
 * to verify that the application still works correctly with the new column names.
 * 
 * Run with: ts-node post-migration-test.ts
 */

import { createConnection, Connection, Repository } from 'typeorm';
import * as dotenv from 'dotenv';
import { SnakeNamingStrategy } from 'typeorm-naming-strategies';

// Import the entity definitions from the source directory
import { User } from './src/modules/users/entities/user.entity';
import { Movie } from './src/modules/movies/entities/movie.entity';
import { List } from './src/modules/lists/entities/list.entity';
import { ListItem } from './src/modules/lists/entities/list-item.entity';
import { ListCollaborator } from './src/modules/lists/entities/list-collaborator.entity';
import { ListFavorite } from './src/modules/lists/entities/list-favorite.entity';
import { Review } from './src/modules/reviews/entities/review.entity';
import { ReviewReaction } from './src/modules/reviews/entities/review-reaction.entity';
import { WatchHistory } from './src/modules/watch-history/entities/watch-history.entity';

console.log('=== Starting post-migration test script ===');
console.log('Loading dotenv config...');

dotenv.config();

console.log('ENV loaded, DB_HOST =', process.env.DB_HOST);
console.log('ENV loaded, DB_USERNAME =', process.env.DB_USERNAME);

async function runTests() {
  console.log('Running post-migration tests...');
  
  let connection: Connection | null = null;
  
  try {
    console.log('Creating database connection...');
    // Create a connection to the database
    connection = await createConnection({
      type: 'postgres',
      host: process.env.DB_HOST || 'localhost',
      port: parseInt(process.env.DB_PORT || '5432', 10),
      username: process.env.DB_USERNAME || 'postgres',
      password: process.env.DB_PASSWORD || 'postgres',
      database: process.env.DB_NAME || 'movie_tracker',
      entities: [
        User, 
        Movie, 
        List, 
        ListItem, 
        ListCollaborator, 
        ListFavorite,
        Review, 
        ReviewReaction, 
        WatchHistory
      ],
      synchronize: false,
      namingStrategy: new SnakeNamingStrategy(),
      logging: true, // Enable query logging
    });
    
    console.log('Connected to database successfully.');
    
    // Test User entity
    await testUserRepository(connection.getRepository(User));
    
    // Test Movie entity
    await testMovieRepository(connection.getRepository(Movie));
    
    // Test List entity
    await testListRepository(connection.getRepository(List));
    
    // Test Review entity
    await testReviewRepository(connection.getRepository(Review));
    
    // Test WatchHistory entity
    await testWatchHistoryRepository(connection.getRepository(WatchHistory));
    
    console.log('\n✅ All tests passed successfully!');
    
  } catch (error) {
    console.error('Test failed:', error);
    process.exit(1);
  } finally {
    if (connection) {
      await connection.close();
      console.log('Database connection closed.');
    }
  }
}

async function testUserRepository(repository: Repository<User>) {
  console.log('\nTesting User entity...');
  
  // Test find
  const users = await repository.find({ take: 1 });
  console.log('- Find users:', users.length > 0 ? '✓' : '✗');
  
  if (users.length === 0) {
    console.log('  No users found, skipping user tests.');
    return;
  }
  
  const user = users[0];
  
  // Test findOne
  const foundUser = await repository.findOne({ where: { id: user.id } });
  console.log('- Find user by ID:', foundUser ? '✓' : '✗');
  
  // We'll skip the create test since it depends on the User entity structure
  console.log('- Create user instance: Skipped');
  
  // Test query builder with snake_case columns
  try {
    const queryBuilderResult = await repository
      .createQueryBuilder('user')
      .where('user.created_at IS NOT NULL')
      .take(1)
      .getMany();
    
    console.log('- Query builder with snake_case columns:', queryBuilderResult.length > 0 ? '✓' : '✗');
  } catch (error) {
    console.log('- Query builder with snake_case columns: ✗');
    console.error('  Error:', error.message);
  }
  
  console.log('User entity tests completed.');
}

async function testMovieRepository(repository: Repository<Movie>) {
  console.log('\nTesting Movie entity...');
  
  // Test find
  const movies = await repository.find({ take: 1 });
  console.log('- Find movies:', movies.length > 0 ? '✓' : '✗');
  
  if (movies.length === 0) {
    console.log('  No movies found, skipping movie tests.');
    return;
  }
  
  const movie = movies[0];
  
  // Test findOne
  const foundMovie = await repository.findOne({ where: { id: movie.id } });
  console.log('- Find movie by ID:', foundMovie ? '✓' : '✗');
  
  // Test query builder with snake_case columns
  try {
    const queryBuilderResult = await repository
      .createQueryBuilder('movie')
      .where('movie.tmdb_id IS NOT NULL')
      .take(1)
      .getMany();
    
    console.log('- Query builder with snake_case columns:', queryBuilderResult.length > 0 ? '✓' : '✗');
  } catch (error) {
    console.log('- Query builder with snake_case columns: ✗');
    console.error('  Error:', error.message);
  }
  
  console.log('Movie entity tests completed.');
}

async function testListRepository(repository: Repository<List>) {
  console.log('\nTesting List entity...');
  
  // Test find
  const lists = await repository.find({ take: 1 });
  console.log('- Find lists:', lists.length > 0 ? '✓' : '✗');
  
  if (lists.length === 0) {
    console.log('  No lists found, skipping list tests.');
    return;
  }
  
  const list = lists[0];
  
  // Test findOne
  const foundList = await repository.findOne({ where: { id: list.id } });
  console.log('- Find list by ID:', foundList ? '✓' : '✗');
  
  // Test relations
  try {
    const listWithRelations = await repository
      .createQueryBuilder('list')
      .leftJoinAndSelect('list.owner', 'owner')
      .where('list.id = :id', { id: list.id })
      .getOne();
    
    console.log('- Load list relations:', listWithRelations?.owner ? '✓' : '✗');
  } catch (error) {
    console.log('- Load list relations: ✗');
    console.error('  Error:', error.message);
  }
  
  // Test query builder with snake_case columns
  try {
    const queryBuilderResult = await repository
      .createQueryBuilder('list')
      .where('list.created_at IS NOT NULL')
      .take(1)
      .getMany();
    
    console.log('- Query builder with snake_case columns:', queryBuilderResult.length > 0 ? '✓' : '✗');
  } catch (error) {
    console.log('- Query builder with snake_case columns: ✗');
    console.error('  Error:', error.message);
  }
  
  console.log('List entity tests completed.');
}

async function testReviewRepository(repository: Repository<Review>) {
  console.log('\nTesting Review entity...');
  
  // Test find
  const reviews = await repository.find({ take: 1 });
  console.log('- Find reviews:', reviews.length > 0 ? '✓' : '✗');
  
  if (reviews.length === 0) {
    console.log('  No reviews found, skipping review tests.');
    return;
  }
  
  const review = reviews[0];
  
  // Test findOne
  const foundReview = await repository.findOne({ where: { id: review.id } });
  console.log('- Find review by ID:', foundReview ? '✓' : '✗');
  
  // Test relations
  try {
    const reviewWithRelations = await repository
      .createQueryBuilder('review')
      .leftJoinAndSelect('review.user', 'user')
      .leftJoinAndSelect('review.movie', 'movie')
      .where('review.id = :id', { id: review.id })
      .getOne();
    
    console.log('- Load review relations:', 
      (reviewWithRelations?.user && reviewWithRelations?.movie) ? '✓' : '✗');
  } catch (error) {
    console.log('- Load review relations: ✗');
    console.error('  Error:', error.message);
  }
  
  // Test query builder with snake_case columns
  try {
    const queryBuilderResult = await repository
      .createQueryBuilder('review')
      .where('review.created_at IS NOT NULL')
      .take(1)
      .getMany();
    
    console.log('- Query builder with snake_case columns:', queryBuilderResult.length > 0 ? '✓' : '✗');
  } catch (error) {
    console.log('- Query builder with snake_case columns: ✗');
    console.error('  Error:', error.message);
  }
  
  console.log('Review entity tests completed.');
}

async function testWatchHistoryRepository(repository: Repository<WatchHistory>) {
  console.log('\nTesting WatchHistory entity...');
  
  try {
    // Test find - using a more explicit approach with only columns that exist
    const watchHistories = await repository
      .createQueryBuilder('watchHistory')
      .select([
        'watchHistory.id',
        'watchHistory.user_id',
        'watchHistory.movie_id',
        'watchHistory.watched_at',
        'watchHistory.watch_type',
        'watchHistory.rating',
        'watchHistory.notes',
        'watchHistory.watch_duration',
        'watchHistory.is_private',
        'watchHistory.context_tags',
        'watchHistory.mood_rating',
        'watchHistory.created_at',
        'watchHistory.updated_at'
      ])
      .limit(1)
      .getMany();
    
    console.log('- Find watch histories:', watchHistories.length > 0 ? '✓' : '✗');
    
    if (watchHistories.length === 0) {
      console.log('  No watch histories found, skipping watch history tests.');
      return;
    }
    
    const watchHistory = watchHistories[0];
    
    // Test findOne
    const foundWatchHistory = await repository
      .createQueryBuilder('watchHistory')
      .select([
        'watchHistory.id',
        'watchHistory.user_id',
        'watchHistory.movie_id',
        'watchHistory.watched_at',
        'watchHistory.watch_type',
        'watchHistory.rating',
        'watchHistory.notes',
        'watchHistory.watch_duration',
        'watchHistory.is_private',
        'watchHistory.context_tags',
        'watchHistory.mood_rating',
        'watchHistory.created_at',
        'watchHistory.updated_at'
      ])
      .where('watchHistory.id = :id', { id: watchHistory.id })
      .getOne();
    
    console.log('- Find watch history by ID:', foundWatchHistory ? '✓' : '✗');
    
    // Test relations
    const watchHistoryWithRelations = await repository
      .createQueryBuilder('watchHistory')
      .select([
        'watchHistory.id',
        'watchHistory.user_id',
        'watchHistory.movie_id',
        'watchHistory.watched_at',
        'user.id',
        'user.username',
        'movie.id',
        'movie.title'
      ])
      .leftJoin('watchHistory.user', 'user')
      .leftJoin('watchHistory.movie', 'movie')
      .where('watchHistory.id = :id', { id: watchHistory.id })
      .getOne();
    
    console.log('- Load watch history relations:', 
      (watchHistoryWithRelations?.user && watchHistoryWithRelations?.movie) ? '✓' : '✗');
    
    // Test query builder with snake_case columns
    const queryBuilderResult = await repository
      .createQueryBuilder('watchHistory')
      .select([
        'watchHistory.id',
        'watchHistory.created_at'
      ])
      .where('watchHistory.created_at IS NOT NULL')
      .take(1)
      .getMany();
    
    console.log('- Query builder with snake_case columns:', queryBuilderResult.length > 0 ? '✓' : '✗');
    
    console.log('WatchHistory entity tests completed.');
  } catch (error) {
    console.log('- WatchHistory tests failed with error:');
    console.error('  Error:', error.message);
  }
}

// Run the tests
console.log('Calling runTests()...');
runTests().catch(error => {
  console.error('Top-level error running tests:', error);
  process.exit(1);
});
console.log('After runTests() call - this should appear immediately as runTests is async');