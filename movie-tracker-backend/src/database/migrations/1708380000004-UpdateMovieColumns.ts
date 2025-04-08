import { MigrationInterface, QueryRunner } from "typeorm";

export class UpdateMovieColumns1708380000004 implements MigrationInterface {
    name = 'UpdateMovieColumns1708380000004'

    public async up(queryRunner: QueryRunner): Promise<void> {
        // First, check existing columns
        const columns = await queryRunner.query(`
            SELECT column_name 
            FROM information_schema.columns 
            WHERE table_name = 'movies'
        `);

        console.log('Existing columns:', columns);

        // Add new columns if they don't exist
        await queryRunner.query(`
            ALTER TABLE "movies" 
            ADD COLUMN IF NOT EXISTS "voteAverage" numeric(4,2),
            ADD COLUMN IF NOT EXISTS "voteCount" integer,
            ADD COLUMN IF NOT EXISTS "isPopular" boolean DEFAULT false
        `);

        // Check if the column exists before attempting to rename
        const columnExists = columns.some(
            (col: any) => col.column_name === 'original_title'
        );

        if (columnExists) {
            await queryRunner.query(`
                ALTER TABLE "movies" 
                RENAME COLUMN "original_title" TO "originalTitle" 
            `);
        } else {
            // If the column doesn't exist, add it
            await queryRunner.query(`
                ALTER TABLE "movies" 
                ADD COLUMN IF NOT EXISTS "originalTitle" character varying
            `);
        }
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        // Revert the changes
        await queryRunner.query(`
            ALTER TABLE "movies" 
            DROP COLUMN IF EXISTS "voteAverage",
            DROP COLUMN IF EXISTS "voteCount",
            DROP COLUMN IF EXISTS "isPopular"
        `);

        // Check if the column exists before attempting to rename back
        const columns = await queryRunner.query(`
            SELECT column_name 
            FROM information_schema.columns 
            WHERE table_name = 'movies'
        `);

        const columnExists = columns.some(
            (col: any) => col.column_name === 'originalTitle'
        );

        if (columnExists) {
            await queryRunner.query(`
                ALTER TABLE "movies" 
                RENAME COLUMN "originalTitle" TO "original_title"
            `);
        }
    }
}