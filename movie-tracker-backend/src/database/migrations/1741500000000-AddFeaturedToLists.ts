import { MigrationInterface, QueryRunner } from "typeorm";

export class AddFeaturedToLists1741500000000 implements MigrationInterface {
    name = 'AddFeaturedToLists1741500000000'

    public async up(queryRunner: QueryRunner): Promise<void> {
        // Add isFeatured column to lists table if it doesn't exist
        const hasColumn = await queryRunner.hasColumn('lists', 'is_featured');
        
        if (!hasColumn) {
            await queryRunner.query(`
                ALTER TABLE "lists" 
                ADD COLUMN "is_featured" boolean NOT NULL DEFAULT false
            `);
            
            await queryRunner.query(`
                CREATE INDEX "idx_lists_is_featured" ON "lists"("is_featured", "createdAt")
            `);
        }
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        // Drop index
        await queryRunner.query(`DROP INDEX IF EXISTS "idx_lists_is_featured"`);
        
        // Drop column
        const hasColumn = await queryRunner.hasColumn('lists', 'is_featured');
        if (hasColumn) {
            await queryRunner.query(`ALTER TABLE "lists" DROP COLUMN "is_featured"`);
        }
    }
}
