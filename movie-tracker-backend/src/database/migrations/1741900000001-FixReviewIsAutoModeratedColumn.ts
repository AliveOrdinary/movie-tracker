import { MigrationInterface, QueryRunner } from "typeorm";

export class FixReviewIsAutoModeratedColumn1741900000001 implements MigrationInterface {
    name = 'FixReviewIsAutoModeratedColumn1741900000001'

    public async up(queryRunner: QueryRunner): Promise<void> {
        // Check if the reviews table exists
        const reviewsTableExists = await queryRunner.hasTable('reviews');
        if (!reviewsTableExists) {
            console.log('Reviews table does not exist, skipping isAutoModerated column addition');
            return;
        }

        // Get existing columns in the reviews table
        const columns = await queryRunner.query(`
            SELECT column_name 
            FROM information_schema.columns 
            WHERE table_name = 'reviews'
        `);
        const columnNames = columns.map((col: any) => col.column_name);
        console.log('Existing columns in reviews table:', columnNames);

        // Check if the isAutoModerated column exists
        if (!columnNames.includes('isautomoderated') && !columnNames.includes('is_auto_moderated')) {
            // Add the missing column
            await queryRunner.query(`
                ALTER TABLE "reviews" 
                ADD COLUMN "isAutoModerated" boolean DEFAULT false
            `);
            console.log('Added missing isAutoModerated column to reviews table');
        } else if (columnNames.includes('is_auto_moderated') && !columnNames.includes('isautomoderated')) {
            // Rename from snake_case to camelCase
            await queryRunner.query(`
                ALTER TABLE "reviews" 
                RENAME COLUMN "is_auto_moderated" TO "isAutoModerated"
            `);
            console.log('Renamed is_auto_moderated to isAutoModerated in reviews table');
        }

        console.log('Review isAutoModerated column fix completed');
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        // No need to implement down migration for this fix
        console.log('No rollback implemented for review isAutoModerated column fix');
    }
}