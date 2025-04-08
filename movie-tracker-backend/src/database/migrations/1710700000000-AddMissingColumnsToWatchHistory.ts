// src/database/migrations/1710700000000-AddMissingColumnsToWatchHistory.ts
import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddMissingColumnsToWatchHistory1710700000000 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    console.log('Starting migration to add missing columns to watch_history table...');

    // Check if watch_count column exists
    const watchCountExists = await columnExists(queryRunner, 'watch_history', 'watch_count');
    if (!watchCountExists) {
      console.log('Adding watch_count column to watch_history table...');
      await queryRunner.query(`
        ALTER TABLE watch_history
        ADD COLUMN watch_count INTEGER NOT NULL DEFAULT 1;
      `);
      console.log('watch_count column added successfully.');
    } else {
      console.log('watch_count column already exists in watch_history table.');
    }

    // Check if is_favorite column exists
    const isFavoriteExists = await columnExists(queryRunner, 'watch_history', 'is_favorite');
    if (!isFavoriteExists) {
      console.log('Adding is_favorite column to watch_history table...');
      await queryRunner.query(`
        ALTER TABLE watch_history
        ADD COLUMN is_favorite BOOLEAN NOT NULL DEFAULT false;
      `);
      console.log('is_favorite column added successfully.');
    } else {
      console.log('is_favorite column already exists in watch_history table.');
    }

    console.log('Migration completed successfully.');
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    console.log('Reverting migration...');

    // Check if is_favorite column exists before dropping
    const isFavoriteExists = await columnExists(queryRunner, 'watch_history', 'is_favorite');
    if (isFavoriteExists) {
      console.log('Dropping is_favorite column from watch_history table...');
      await queryRunner.query(`
        ALTER TABLE watch_history
        DROP COLUMN is_favorite;
      `);
      console.log('is_favorite column dropped successfully.');
    }

    // Check if watch_count column exists before dropping
    const watchCountExists = await columnExists(queryRunner, 'watch_history', 'watch_count');
    if (watchCountExists) {
      console.log('Dropping watch_count column from watch_history table...');
      await queryRunner.query(`
        ALTER TABLE watch_history
        DROP COLUMN watch_count;
      `);
      console.log('watch_count column dropped successfully.');
    }

    console.log('Migration reversion completed successfully.');
  }
}

// Helper function to check if a column exists in a table
async function columnExists(
  queryRunner: QueryRunner,
  tableName: string,
  columnName: string
): Promise<boolean> {
  const result = await queryRunner.query(`
    SELECT column_name
    FROM information_schema.columns 
    WHERE table_name = $1 AND column_name = $2;
  `, [tableName, columnName]);
  
  return result.length > 0;
}
