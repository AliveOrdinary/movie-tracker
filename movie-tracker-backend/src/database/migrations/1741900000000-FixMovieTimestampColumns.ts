import { MigrationInterface, QueryRunner } from "typeorm";

export class FixMovieTimestampColumns1741900000000 implements MigrationInterface {
    name = 'FixMovieTimestampColumns1741900000000'

    public async up(queryRunner: QueryRunner): Promise<void> {
        // Check if the movies table exists
        const moviesTableExists = await queryRunner.hasTable('movies');
        if (!moviesTableExists) {
            console.log('Movies table does not exist, skipping timestamp column fixes');
            return;
        }

        // Get existing columns
        const columns = await queryRunner.query(`
            SELECT column_name 
            FROM information_schema.columns 
            WHERE table_name = 'movies'
        `);
        const columnNames = columns.map((col: any) => col.column_name);
        console.log('Existing columns in movies table:', columnNames);

        // Check for "created_at" and "createdAt" inconsistency
        const hasCreatedAt = columnNames.includes('createdat') || columnNames.includes('createdAt');
        const hasCreated_at = columnNames.includes('created_at');
        
        const hasUpdatedAt = columnNames.includes('updatedat') || columnNames.includes('updatedAt');
        const hasUpdated_at = columnNames.includes('updated_at');

        // Handle createdAt column
        if (!hasCreatedAt && !hasCreated_at) {
            // Neither column exists, add createdAt
            await queryRunner.query(`
                ALTER TABLE "movies" 
                ADD COLUMN "createdAt" timestamp DEFAULT CURRENT_TIMESTAMP
            `);
            console.log('Added missing createdAt column to movies table');
        } else if (hasCreated_at && !hasCreatedAt) {
            // Only snake_case exists, rename it
            await queryRunner.query(`
                ALTER TABLE "movies" 
                RENAME COLUMN "created_at" TO "createdAt"
            `);
            console.log('Renamed created_at to createdAt in movies table');
        }

        // Handle updatedAt column
        if (!hasUpdatedAt && !hasUpdated_at) {
            // Neither column exists, add updatedAt
            await queryRunner.query(`
                ALTER TABLE "movies" 
                ADD COLUMN "updatedAt" timestamp DEFAULT CURRENT_TIMESTAMP
            `);
            console.log('Added missing updatedAt column to movies table');
        } else if (hasUpdated_at && !hasUpdatedAt) {
            // Only snake_case exists, rename it
            await queryRunner.query(`
                ALTER TABLE "movies" 
                RENAME COLUMN "updated_at" TO "updatedAt"
            `);
            console.log('Renamed updated_at to updatedAt in movies table');
        }

        // Also make sure the original timestamp columns are properly named
        if (columnNames.includes('releasedate') && !columnNames.includes('releaseyear')) {
            // Add releaseYear if it doesn't exist
            await queryRunner.query(`
                ALTER TABLE "movies" 
                ADD COLUMN IF NOT EXISTS "releaseYear" integer
            `);
            
            // Update releaseYear based on releaseDate
            await queryRunner.query(`
                UPDATE "movies"
                SET "releaseYear" = EXTRACT(YEAR FROM "releaseDate"::date)
                WHERE "releaseYear" IS NULL AND "releaseDate" IS NOT NULL
            `);
            console.log('Added and populated releaseYear column in movies table');
        }

        // Make sure other required columns exist
        if (!columnNames.includes('originaltitle')) {
            await queryRunner.query(`
                ALTER TABLE "movies" 
                ADD COLUMN IF NOT EXISTS "originalTitle" character varying DEFAULT ''
            `);
            
            // Set originalTitle to same as title if missing
            await queryRunner.query(`
                UPDATE "movies"
                SET "originalTitle" = "title"
                WHERE "originalTitle" IS NULL OR "originalTitle" = ''
            `);
            console.log('Added and populated originalTitle column in movies table');
        }

        if (!columnNames.includes('languages')) {
            await queryRunner.query(`
                ALTER TABLE "movies" 
                ADD COLUMN IF NOT EXISTS "languages" text[] DEFAULT '{}'::text[]
            `);
            console.log('Added languages column in movies table');
        }

        if (!columnNames.includes('isadult')) {
            await queryRunner.query(`
                ALTER TABLE "movies" 
                ADD COLUMN IF NOT EXISTS "isAdult" boolean DEFAULT false
            `);
            console.log('Added isAdult column in movies table');
        }

        console.log('Movie timestamp and required columns fix completed');
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        // No need to implement down migration
        console.log('No rollback implemented for movie timestamp columns fix');
    }
}