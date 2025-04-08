import { MigrationInterface, QueryRunner } from "typeorm";

export class AdminModuleEnhancements1741300000000 implements MigrationInterface {
    name = 'AdminModuleEnhancements1741300000000'

    public async up(queryRunner: QueryRunner): Promise<void> {
        // Check if lists table exists
        const listsTableExists = await queryRunner.hasTable('lists');
        if (listsTableExists) {
            // Add isFeatured column to lists if it doesn't exist
            const hasFeaturedColumn = await queryRunner.hasColumn('lists', 'isFeatured');
            if (!hasFeaturedColumn) {
                await queryRunner.query(`
                    ALTER TABLE "lists" 
                    ADD COLUMN "isFeatured" boolean NOT NULL DEFAULT false
                `);
            }
        }

        // Check if admin_audit_logs table exists and ensure it has the correct structure
        const adminAuditLogsTableExists = await queryRunner.hasTable('admin_audit_logs');
        if (!adminAuditLogsTableExists) {
            // Create admin_audit_logs table
            await queryRunner.query(`
                CREATE TABLE "admin_audit_logs" (
                    "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
                    "admin_id" uuid NOT NULL,
                    "action" character varying NOT NULL,
                    "details" text,
                    "entityId" character varying,
                    "entityType" character varying,
                    "ipAddress" character varying NOT NULL,
                    "timestamp" TIMESTAMP NOT NULL DEFAULT now(),
                    CONSTRAINT "PK_admin_audit_logs" PRIMARY KEY ("id")
                )
            `);

            await queryRunner.query(`
                CREATE INDEX "IDX_admin_audit_logs_timestamp" ON "admin_audit_logs" ("timestamp")
            `);

            await queryRunner.query(`
                CREATE INDEX "IDX_admin_audit_logs_entity" ON "admin_audit_logs" ("entityId", "entityType")
            `);

            await queryRunner.query(`
                ALTER TABLE "admin_audit_logs" 
                ADD CONSTRAINT "FK_admin_audit_logs_admin" 
                FOREIGN KEY ("admin_id") REFERENCES "users"("id") ON DELETE CASCADE
            `);
        }

        // Create system_configs table if it doesn't exist
        const systemConfigsTableExists = await queryRunner.hasTable('system_configs');
        if (!systemConfigsTableExists) {
            await queryRunner.query(`
                CREATE TABLE "system_configs" (
                    "key" character varying NOT NULL,
                    "value" text NOT NULL,
                    "category" character varying NOT NULL,
                    "description" character varying,
                    "createdAt" TIMESTAMP NOT NULL DEFAULT now(),
                    "updatedAt" TIMESTAMP NOT NULL DEFAULT now(),
                    CONSTRAINT "PK_system_configs" PRIMARY KEY ("key")
                )
            `);

            await queryRunner.query(`
                CREATE INDEX "IDX_system_config_category" ON "system_configs" ("category")
            `);

            // Insert default system configurations
            await queryRunner.query(`
                INSERT INTO system_configs (key, value, category, description)
                VALUES 
                    ('site.name', 'Movie Tracker', 'GENERAL', 'Application name'),
                    ('site.description', 'Track and share your movie watching experience', 'GENERAL', 'Application description'),
                    ('site.maintenance_mode', 'false', 'GENERAL', 'Enable maintenance mode'),
                    ('content.max_reviews_per_day', '10', 'CONTENT', 'Maximum reviews a regular user can create per day'),
                    ('content.max_lists_per_user', '50', 'CONTENT', 'Maximum lists a user can create'),
                    ('content.enable_review_reactions', 'true', 'CONTENT', 'Enable reactions on reviews'),
                    ('moderation.auto_approve_reviews', 'false', 'MODERATION', 'Auto-approve reviews from trusted users'),
                    ('moderation.min_reputation_for_auto_approve', '50', 'MODERATION', 'Minimum reputation required for auto-approval'),
                    ('performance.cache_ttl', '3600', 'PERFORMANCE', 'Default cache TTL in seconds'),
                    ('performance.max_items_per_page', '100', 'PERFORMANCE', 'Maximum items per page in paginated responses')
                ON CONFLICT (key) DO NOTHING
            `);
        }

        // Add isPopular field to movies table if it doesn't exist
        const moviesTableExists = await queryRunner.hasTable('movies');
        if (moviesTableExists) {
            const hasPopularColumn = await queryRunner.hasColumn('movies', 'isPopular');
            if (!hasPopularColumn) {
                await queryRunner.query(`
                    ALTER TABLE "movies" 
                    ADD COLUMN "isPopular" boolean NOT NULL DEFAULT false
                `);
            }
        }
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        // We won't drop entire tables here as they might contain important data
        
        // Remove isFeatured from lists if it exists
        const listsTableExists = await queryRunner.hasTable('lists');
        if (listsTableExists) {
            const hasFeaturedColumn = await queryRunner.hasColumn('lists', 'isFeatured');
            if (hasFeaturedColumn) {
                await queryRunner.query(`
                    ALTER TABLE "lists" 
                    DROP COLUMN "isFeatured"
                `);
            }
        }

        // Remove isPopular from movies if it exists
        const moviesTableExists = await queryRunner.hasTable('movies');
        if (moviesTableExists) {
            const hasPopularColumn = await queryRunner.hasColumn('movies', 'isPopular');
            if (hasPopularColumn) {
                await queryRunner.query(`
                    ALTER TABLE "movies" 
                    DROP COLUMN "isPopular"
                `);
            }
        }
    }
}