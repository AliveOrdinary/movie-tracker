import { MigrationInterface, QueryRunner } from 'typeorm';
import { columnExists } from './1710643200000-AddContextTagsColumn';

export class UpdateListItemMovieIdColumn1722000000000 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    console.log('Starting migration to update list_items.movie_id column to use UUID...');

    // First create a temporary column to store the new UUIDs
    await queryRunner.query(`
      ALTER TABLE list_items ADD COLUMN movie_uuid_temp UUID NULL;
    `);
    console.log('Added temporary movie_uuid_temp column');

    // Get all existing entries with TMDB IDs
    const listItems = await queryRunner.query(`
      SELECT li.id, li.movie_id
      FROM list_items li
    `);
    console.log(`Found ${listItems.length} list items to update`);

    // For each list item, find the corresponding movie by TMDB ID and update the temp UUID column
    let updatedCount = 0;
    let skippedCount = 0;

    for (const item of listItems) {
      const tmdbId = item.movie_id;
      
      // Find the Movie entry by TMDB ID
      const movies = await queryRunner.query(`
        SELECT id 
        FROM movies 
        WHERE tmdb_id = $1
        LIMIT 1
      `, [tmdbId]);
      
      if (movies.length > 0) {
        const movieUuid = movies[0].id;
        
        // Update the temp column
        await queryRunner.query(`
          UPDATE list_items
          SET movie_uuid_temp = $1
          WHERE id = $2
        `, [movieUuid, item.id]);
        
        updatedCount++;
      } else {
        console.log(`Could not find movie with TMDB ID ${tmdbId}, skipping list item ${item.id}`);
        skippedCount++;
      }
    }
    
    console.log(`Updated ${updatedCount} list items with movie UUIDs`);
    console.log(`Skipped ${skippedCount} list items (movies not found)`);

    // Create foreign key constraint to ensure data integrity
    await queryRunner.query(`
      ALTER TABLE list_items
      ADD CONSTRAINT fk_list_items_movie
      FOREIGN KEY (movie_uuid_temp)
      REFERENCES movies(id)
      ON DELETE CASCADE;
    `);
    console.log('Added foreign key constraint');

    // Now drop the old column and rename the temp column
    await queryRunner.query(`
      ALTER TABLE list_items DROP COLUMN movie_id;
      ALTER TABLE list_items RENAME COLUMN movie_uuid_temp TO movie_id;
    `);
    console.log('Renamed temp column to movie_id');

    // The migration is complete
    console.log('Migration completed successfully.');
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    console.log('Reverting migration...');

    // First check if we have the UUID column
    const movieIdExists = await columnExists(queryRunner, 'list_items', 'movie_id');
    
    if (movieIdExists) {
      // Create a temporary bigint column
      await queryRunner.query(`
        ALTER TABLE list_items ADD COLUMN movie_id_bigint BIGINT NULL;
      `);
      console.log('Added temporary movie_id_bigint column');

      // For each list item, get the TMDB ID from the movie table
      const listItems = await queryRunner.query(`
        SELECT li.id, li.movie_id, m.tmdb_id
        FROM list_items li
        LEFT JOIN movies m ON li.movie_id = m.id
      `);
      
      let updatedCount = 0;
      let skippedCount = 0;

      for (const item of listItems) {
        if (item.tmdb_id) {
          // Update the temp column with the TMDB ID
          await queryRunner.query(`
            UPDATE list_items
            SET movie_id_bigint = $1
            WHERE id = $2
          `, [item.tmdb_id, item.id]);
          
          updatedCount++;
        } else {
          console.log(`Could not find TMDB ID for movie ${item.movie_id}, skipping list item ${item.id}`);
          skippedCount++;
        }
      }
      
      console.log(`Reverted ${updatedCount} list items to TMDB IDs`);
      console.log(`Skipped ${skippedCount} list items (TMDB IDs not found)`);

      // Now drop the old column and rename the temp column
      await queryRunner.query(`
        ALTER TABLE list_items DROP CONSTRAINT IF EXISTS fk_list_items_movie;
        ALTER TABLE list_items DROP COLUMN movie_id;
        ALTER TABLE list_items RENAME COLUMN movie_id_bigint TO movie_id;
      `);
      console.log('Renamed temp column back to movie_id');
    }

    console.log('Migration reversion completed successfully.');
  }
}
