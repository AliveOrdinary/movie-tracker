import { MigrationInterface, QueryRunner } from 'typeorm';

export class UpdateMovieIdColumnType1742000000000 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    // First create a new column with the right type
    await queryRunner.query(`
      ALTER TABLE list_items 
      ADD COLUMN movie_id_bigint BIGINT
    `);

    // Copy the data from the old column to the new one
    await queryRunner.query(`
      UPDATE list_items 
      SET movie_id_bigint = movie_id::BIGINT
    `);

    // Drop the old column
    await queryRunner.query(`
      ALTER TABLE list_items 
      DROP COLUMN movie_id
    `);

    // Rename the new column to the original name
    await queryRunner.query(`
      ALTER TABLE list_items 
      RENAME COLUMN movie_id_bigint TO movie_id
    `);

    // Recreate any indexes or constraints on the column
    await queryRunner.query(`
      CREATE UNIQUE INDEX list_items_list_id_movie_id_unique_idx
      ON list_items (list_id, movie_id)
    `);
    
    // Create a separate index just on movie_id to improve movie lookup performance
    await queryRunner.query(`
      CREATE INDEX list_items_movie_id_idx
      ON list_items (movie_id)
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // If needed, revert back to the original type
    // (This is intentionally left empty as it's usually safer to not revert a data type change)
    // If you need to revert, you would do the same steps in reverse
  }
}
