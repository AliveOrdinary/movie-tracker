import { MigrationInterface, QueryRunner } from 'typeorm';

export class CorrectListItemMovieIdToUUID1743000000000 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    console.log('Starting migration to correct list_items.movie_id column to use UUID...');

    // First check if the movie_id column exists and what type it is
    const columnInfo = await queryRunner.query(`
      SELECT data_type 
      FROM information_schema.columns 
      WHERE table_name = 'list_items' AND column_name = 'movie_id'
    `);

    if (columnInfo.length === 0) {
      console.log('movie_id column not found in list_items table, no action needed');
      return;
    }

    const currentType = columnInfo[0].data_type.toLowerCase();
    console.log(`Current movie_id column type: ${currentType}`);

    // If it's already UUID, check if it has the foreign key constraint
    if (currentType === 'uuid') {
      console.log('Column is already UUID type, checking for foreign key constraint...');
      
      // Check for existing foreign key constraint
      const fkConstraints = await queryRunner.query(`
        SELECT con.conname AS constraint_name
        FROM pg_constraint con
        JOIN pg_class rel ON rel.oid = con.conrelid
        JOIN pg_namespace nsp ON nsp.oid = rel.relnamespace
        JOIN pg_attribute att ON att.attrelid = rel.oid AND att.attnum = ANY(con.conkey)
        WHERE rel.relname = 'list_items'
        AND att.attname = 'movie_id' 
        AND con.contype = 'f'
      `);

      if (fkConstraints.length > 0) {
        console.log(`Foreign key constraint already exists: ${fkConstraints[0].constraint_name}`);
        return;
      }

      // Add the foreign key constraint
      console.log('Adding foreign key constraint to movie_id column...');
      await queryRunner.query(`
        ALTER TABLE list_items
        ADD CONSTRAINT fk_list_items_movie
        FOREIGN KEY (movie_id)
        REFERENCES movies(id)
        ON DELETE CASCADE;
      `);
      console.log('Foreign key constraint added successfully');
      return;
    }

    // If it's a bigint, we need to convert it to UUID
    if (currentType === 'bigint') {
      console.log('Column is BIGINT, converting to UUID...');

      // First, drop any existing indexes or constraints
      console.log('Dropping any existing indexes or constraints on movie_id...');
      const indexes = await queryRunner.query(`
        SELECT indexname
        FROM pg_indexes
        WHERE tablename = 'list_items' AND indexdef LIKE '%movie_id%'
      `);

      for (const index of indexes) {
        console.log(`Dropping index: ${index.indexname}`);
        await queryRunner.query(`DROP INDEX IF EXISTS "${index.indexname}"`);
      }

      // Now create a temporary UUID column
      console.log('Adding temporary UUID column...');
      await queryRunner.query(`
        ALTER TABLE list_items
        ADD COLUMN movie_uuid_temp UUID NULL;
      `);

      // Get all list items
      const listItems = await queryRunner.query(`
        SELECT id, movie_id
        FROM list_items
        WHERE movie_id IS NOT NULL
      `);
      console.log(`Found ${listItems.length} list items to update`);

      // For each list item, find the corresponding movie by TMDB ID
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

      // Now drop the old column and rename the new one
      console.log('Dropping old movie_id column and renaming temp column...');
      await queryRunner.query(`
        ALTER TABLE list_items DROP COLUMN movie_id;
        ALTER TABLE list_items RENAME COLUMN movie_uuid_temp TO movie_id;
      `);

      // Add foreign key constraint
      console.log('Adding foreign key constraint...');
      await queryRunner.query(`
        ALTER TABLE list_items
        ADD CONSTRAINT fk_list_items_movie
        FOREIGN KEY (movie_id)
        REFERENCES movies(id)
        ON DELETE CASCADE;
      `);

      // Recreate indexes
      console.log('Creating indexes on movie_id...');
      await queryRunner.query(`
        CREATE INDEX idx_list_items_movie_id ON list_items (movie_id);
        CREATE UNIQUE INDEX list_items_list_id_movie_id_unique_idx ON list_items (list_id, movie_id);
      `);
    }

    console.log('Migration completed successfully.');
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // This is a corrective migration, so we don't provide a down migration
    // as it would be unsafe to try to revert to an inconsistent state
    console.log('No down migration implemented for this corrective migration');
  }
}