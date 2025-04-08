import { MigrationInterface, QueryRunner } from "typeorm";

export class ConsolidateMovieColumnsUpdates1741700000000 implements MigrationInterface {
    name = 'ConsolidateMovieColumnsUpdates1741700000000'

    public async up(queryRunner: QueryRunner): Promise<void> {
        // Check if the movies table exists
        const moviesTableExists = await queryRunner.hasTable('movies');
        if (!moviesTableExists) {
            console.log('Movies table does not exist, skipping consolidation');
            return;
        }

        // Get existing columns
        const columns = await queryRunner.query(`
            SELECT column_name 
            FROM information_schema.columns 
            WHERE table_name = 'movies'
        `);
        const columnNames = columns.map((col: any) => col.column_name);
        console.log('Existing columns:', columnNames);

        // Consolidated handling of all movie column updates
        
        // 1. Add vote columns if they don't exist
        if (!columnNames.includes('voteaverage')) {
            await queryRunner.query(`
                ALTER TABLE "movies" 
                ADD COLUMN IF NOT EXISTS "voteAverage" numeric(4,2)
            `);
        }
        
        if (!columnNames.includes('votecount')) {
            await queryRunner.query(`
                ALTER TABLE "movies" 
                ADD COLUMN IF NOT EXISTS "voteCount" integer
            `);
        }
        
        // 2. Add isPopular column if it doesn't exist
        if (!columnNames.includes('ispopular')) {
            await queryRunner.query(`
                ALTER TABLE "movies" 
                ADD COLUMN IF NOT EXISTS "isPopular" boolean DEFAULT false
            `);
        }
        
        // 3. Handle original title column naming
        if (columnNames.includes('original_title') && !columnNames.includes('originaltitle')) {
            await queryRunner.query(`
                ALTER TABLE "movies" 
                RENAME COLUMN "original_title" TO "originalTitle" 
            `);
        } else if (!columnNames.includes('originaltitle')) {
            await queryRunner.query(`
                ALTER TABLE "movies" 
                ADD COLUMN IF NOT EXISTS "originalTitle" character varying
            `);
        }

        console.log('Movie columns consolidation completed');
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        // No need to implement down migration as this is a consolidation
        // of existing migrations. If needed, we could revert to snake_case naming
        // and drop added columns, but it's likely not necessary.
        console.log('No rollback implemented for movie columns consolidation');
    }
}
