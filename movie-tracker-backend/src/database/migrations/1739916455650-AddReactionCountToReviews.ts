import { MigrationInterface, QueryRunner } from "typeorm";

export class AddReactionCountToReviews1739916455650 implements MigrationInterface {

    public async up(queryRunner: QueryRunner): Promise<void> {
        // Check if reviews table exists
        const reviewsTableExists = await queryRunner.hasTable('reviews');
        if (reviewsTableExists) {
            // Check if reaction_count column or reactionCount already exists
            const hasSnakeCaseColumn = await queryRunner.hasColumn('reviews', 'reaction_count');
            const hasCamelCaseColumn = await queryRunner.hasColumn('reviews', 'reactionCount');
            
            // React based on which columns exist
            if (!hasSnakeCaseColumn && !hasCamelCaseColumn) {
                // No column exists, add it as specified in entity (reaction_count)
                await queryRunner.query(`
                    ALTER TABLE "reviews" 
                    ADD COLUMN "reaction_count" integer NOT NULL DEFAULT 0
                `);
                
                // Create an index on reaction_count for sorting by popularity
                await queryRunner.query(`
                    CREATE INDEX "idx_reviews_reaction_count" ON "reviews"("reaction_count" DESC)
                `);
                
                // Update existing reviews to count their reactions
                await queryRunner.query(`
                    UPDATE reviews r
                    SET reaction_count = (
                        SELECT COUNT(*)
                        FROM review_reactions rr
                        WHERE rr.review_id = r.id
                    )
                `);
                
                console.log('Added and populated reaction_count column to reviews table');
            } else {
                console.log('Reaction count column already exists in reviews table');
            }
        }
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        // Check if the table and columns exist
        const reviewsTableExists = await queryRunner.hasTable('reviews');
        if (reviewsTableExists) {
            const hasSnakeCaseColumn = await queryRunner.hasColumn('reviews', 'reaction_count');
            const hasCamelCaseColumn = await queryRunner.hasColumn('reviews', 'reactionCount');
            
            // Drop snake_case column and index if they exist
            if (hasSnakeCaseColumn) {
                await queryRunner.query('DROP INDEX IF EXISTS "idx_reviews_reaction_count"');
                await queryRunner.query('ALTER TABLE "reviews" DROP COLUMN "reaction_count"');
                console.log('Dropped reaction_count column from reviews');
            }
            
            // Drop camelCase column and index if they exist
            if (hasCamelCaseColumn) {
                await queryRunner.query('DROP INDEX IF EXISTS "idx_reviews_reactionCount"');
                await queryRunner.query('ALTER TABLE "reviews" DROP COLUMN "reactionCount"');
                console.log('Dropped reactionCount column from reviews');
            }
        }
    }
}
