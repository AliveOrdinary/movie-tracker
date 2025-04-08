// src/database/migrations/1709193600002-SimplifiedMovieTableCleanup.ts
import { MigrationInterface, QueryRunner } from "typeorm";

export class SimplifiedMovieTableCleanup1709193600002 implements MigrationInterface {
    name = 'SimplifiedMovieTableCleanup1709193600002'

    public async up(queryRunner: QueryRunner): Promise<void> {
        // Count rows in movie table
        const movieCount = await queryRunner.query(`SELECT COUNT(*) FROM "movie"`);
        
        console.log(`Found ${movieCount[0].count} rows in movie table`);
        
        if (parseInt(movieCount[0].count) > 0) {
            console.log('Moving unique records from movie to movies...');
            
            // Try to move any unique data that doesn't already exist in movies
            try {
                await queryRunner.query(`
                    INSERT INTO "movies" ("id", "tmdbId", "title", "originalTitle", "overview", "releaseYear", 
                                         "posterPath", "backdropPath", "genres", "runtime", "languages", "isAdult")
                    SELECT 
                        m."id", 
                        m."tmdbId", 
                        m."title", 
                        m."original_title", 
                        m."overview", 
                        m."releaseYear", 
                        m."posterPath", 
                        m."backdropPath", 
                        m."genres", 
                        m."runtime", 
                        m."languages", 
                        m."isAdult"
                    FROM "movie" m
                    LEFT JOIN "movies" ms ON m."tmdbId" = ms."tmdbId"
                    WHERE ms."id" IS NULL
                    ON CONFLICT ("tmdbId") DO NOTHING
                `);
                
                console.log('Data migration completed');
            } catch (error) {
                console.log('Data migration error:', error.message);
                console.log('Continuing with table cleanup...');
            }
        }
        
        // Drop the movie table with CASCADE to handle any remaining dependencies
        console.log('Dropping movie table...');
        await queryRunner.query(`DROP TABLE IF EXISTS "movie" CASCADE`);
        
        console.log('Movie table cleanup completed');
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        console.log('This is a cleanup migration and cannot be reverted');
    }
}