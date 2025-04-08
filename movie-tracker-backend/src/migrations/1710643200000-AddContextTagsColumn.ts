import { MigrationInterface, QueryRunner } from 'typeorm';

export async function columnExists(
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

export class AddContextTagsColumn1710643200000 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    console.log('Starting migration to add context_tags column to watch_history table...');

    // Check if context_tags column exists
    const contextTagsExists = await columnExists(queryRunner, 'watch_history', 'context_tags');
    if (!contextTagsExists) {
      console.log('Adding context_tags column to watch_history table...');
      await queryRunner.query(`
        ALTER TABLE watch_history
        ADD COLUMN context_tags TEXT NULL;
      `);
      console.log('context_tags column added successfully.');
    } else {
      console.log('context_tags column already exists in watch_history table.');
    }

    // Check if mood_rating column exists
    const moodRatingExists = await columnExists(queryRunner, 'watch_history', 'mood_rating');
    if (!moodRatingExists) {
      console.log('Adding mood_rating column to watch_history table...');
      await queryRunner.query(`
        ALTER TABLE watch_history
        ADD COLUMN mood_rating INTEGER NULL;
      `);
      console.log('mood_rating column added successfully.');
    } else {
      console.log('mood_rating column already exists in watch_history table.');
    }

    console.log('Migration completed successfully.');
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    console.log('Reverting migration...');

    // Check if context_tags column exists before dropping
    const contextTagsExists = await columnExists(queryRunner, 'watch_history', 'context_tags');
    if (contextTagsExists) {
      console.log('Dropping context_tags column from watch_history table...');
      await queryRunner.query(`
        ALTER TABLE watch_history
        DROP COLUMN context_tags;
      `);
      console.log('context_tags column dropped successfully.');
    }

    // Check if mood_rating column exists before dropping
    const moodRatingExists = await columnExists(queryRunner, 'watch_history', 'mood_rating');
    if (moodRatingExists) {
      console.log('Dropping mood_rating column from watch_history table...');
      await queryRunner.query(`
        ALTER TABLE watch_history
        DROP COLUMN mood_rating;
      `);
      console.log('mood_rating column dropped successfully.');
    }

    console.log('Migration reversion completed successfully.');
  }
}
