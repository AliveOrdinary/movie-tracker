import { MigrationInterface, QueryRunner } from 'typeorm';

/**
 * Migration to ensure that list_items.movie_id is properly defined as UUID with correct constraints
 */
export class FixListItemMovieIdUUID1774000000000 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    console.log('Starting migration to fix list_items.movie_id column...');

    // First, check if the foreign key exists and drop it
    try {
      console.log('Checking for existing foreign key on list_items.movie_id');
      
      // Get existing foreign key constraints
      const query = `
        SELECT con.conname AS constraint_name
        FROM pg_constraint con
        INNER JOIN pg_class rel ON rel.oid = con.conrelid
        INNER JOIN pg_namespace nsp ON nsp.oid = rel.relnamespace
        WHERE rel.relname = 'list_items'
        AND con.contype = 'f'
        AND EXISTS (
          SELECT 1 
          FROM pg_attribute att
          WHERE att.attrelid = rel.oid 
          AND att.attnum = ANY(con.conkey) 
          AND att.attname = 'movie_id'
        );
      `;
      
      const foreignKeys = await queryRunner.query(query);
      
      if (foreignKeys.length > 0) {
        console.log(`Found foreign key constraints: ${JSON.stringify(foreignKeys)}`);
        
        for (const { constraint_name } of foreignKeys) {
          console.log(`Dropping foreign key constraint: ${constraint_name}`);
          await queryRunner.query(`
            ALTER TABLE list_items DROP CONSTRAINT IF EXISTS ${constraint_name};
          `);
        }
      } else {
        console.log('No existing foreign key constraints found on list_items.movie_id');
      }
    } catch (error) {
      console.warn('Error checking/dropping foreign key:', error.message);
    }

    // Check column type
    try {
      console.log('Checking movie_id column type');
      const columnInfo = await queryRunner.query(`
        SELECT data_type 
        FROM information_schema.columns 
        WHERE table_name = 'list_items' 
        AND column_name = 'movie_id';
      `);
      
      if (columnInfo.length > 0) {
        const dataType = columnInfo[0].data_type.toLowerCase();
        console.log(`Current data type of movie_id: ${dataType}`);
        
        // If it's not UUID, change it to UUID
        if (dataType !== 'uuid') {
          console.log('Converting movie_id column to UUID type');
          
          // First create a temporary UUID column
          await queryRunner.query(`
            ALTER TABLE list_items ADD COLUMN movie_uuid_temp UUID NULL;
          `);
          console.log('Added temporary movie_uuid_temp column');
          
          // Get all existing entries
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
          
          // Now drop the old column and rename the temp column
          await queryRunner.query(`
            ALTER TABLE list_items DROP COLUMN movie_id;
            ALTER TABLE list_items RENAME COLUMN movie_uuid_temp TO movie_id;
          `);
          console.log('Renamed temp column to movie_id');
        } else {
          console.log('movie_id column is already UUID type - no conversion needed');
        }
      } else {
        console.warn('Could not find movie_id column in list_items table');
      }
    } catch (error) {
      console.error('Error converting column type:', error.message);
      throw error;
    }

    // Finally, add the foreign key constraint if it doesn't exist
    try {
      console.log('Adding foreign key constraint to movie_id');
      await queryRunner.query(`
        ALTER TABLE list_items
        ADD CONSTRAINT fk_list_items_movie
        FOREIGN KEY (movie_id)
        REFERENCES movies(id)
        ON DELETE CASCADE;
      `);
      console.log('Added foreign key constraint');
    } catch (error) {
      console.warn('Error adding foreign key constraint:', error.message);
      console.warn('This may happen if the constraint already exists');
    }

    console.log('Migration completed successfully');
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    console.log('No down migration is provided for this fix. It should not be reversed.');
  }
}
