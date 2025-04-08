import { MigrationInterface, QueryRunner } from "typeorm";

export class UpdateAdminTables1741200000000 implements MigrationInterface {
    name = 'UpdateAdminTables1741200000000'

    public async up(queryRunner: QueryRunner): Promise<void> {
        // Check if admin_audit_logs table exists
        const adminAuditLogsTableExists = await queryRunner.hasTable('admin_audit_logs');
        
        if (adminAuditLogsTableExists) {
            // Update admin_audit_logs table structure to match entity
            const hasEntityIdColumn = await queryRunner.hasColumn('admin_audit_logs', 'entityId');
            if (!hasEntityIdColumn) {
                await queryRunner.query(`
                    ALTER TABLE "admin_audit_logs"
                    ADD COLUMN "entityId" character varying NULL
                `);
            }

            const hasEntityTypeColumn = await queryRunner.hasColumn('admin_audit_logs', 'entityType');
            if (!hasEntityTypeColumn) {
                await queryRunner.query(`
                    ALTER TABLE "admin_audit_logs"
                    ADD COLUMN "entityType" character varying NULL
                `);
            }

            const hasDetailsColumn = await queryRunner.hasColumn('admin_audit_logs', 'details');
            if (!hasDetailsColumn) {
                await queryRunner.query(`
                    ALTER TABLE "admin_audit_logs"
                    ADD COLUMN "details" text NULL
                `);
            }

            // Rename timestamp column if it doesn't exist
            const hasTimestampColumn = await queryRunner.hasColumn('admin_audit_logs', 'timestamp');
            if (!hasTimestampColumn) {
                const hasCreatedAtColumn = await queryRunner.hasColumn('admin_audit_logs', 'createdAt');
                if (hasCreatedAtColumn) {
                    await queryRunner.query(`
                        ALTER TABLE "admin_audit_logs"
                        RENAME COLUMN "createdAt" TO "timestamp"
                    `);
                } else {
                    await queryRunner.query(`
                        ALTER TABLE "admin_audit_logs"
                        ADD COLUMN "timestamp" TIMESTAMP NOT NULL DEFAULT now()
                    `);
                }
            }
        } else {
            // Create admin_audit_logs table from scratch
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

        // Check if system_configs table exists
        const systemConfigsTableExists = await queryRunner.hasTable('system_configs');
        
        if (systemConfigsTableExists) {
            // For system_configs, ensure it has the proper structure
            const table = await queryRunner.getTable('system_configs');
            const hasKeyAsPrimaryKey = table ? (table.findColumnByName('key')?.isPrimary ?? false) : false;
            
            if (!hasKeyAsPrimaryKey) {
                // First check if there's an existing primary key constraint
                const primaryKeyConstraints = await queryRunner.query(`
                    SELECT constraint_name 
                    FROM information_schema.table_constraints 
                    WHERE table_name = 'system_configs' 
                    AND constraint_type = 'PRIMARY KEY'
                `);
                
                if (primaryKeyConstraints.length > 0) {
                    // Drop the existing primary key
                    await queryRunner.query(`
                        ALTER TABLE "system_configs" DROP CONSTRAINT "${primaryKeyConstraints[0].constraint_name}"
                    `);
                }
                
                // Remove id column if it exists
                const hasIdColumn = await queryRunner.hasColumn('system_configs', 'id');
                if (hasIdColumn) {
                    await queryRunner.query(`
                        ALTER TABLE "system_configs" DROP COLUMN "id"
                    `);
                }
                
                // Make key the primary key
                await queryRunner.query(`
                    ALTER TABLE "system_configs"
                    ADD CONSTRAINT "PK_system_configs" PRIMARY KEY ("key")
                `);
            }
        } else {
            // Create system_configs table from scratch
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
        }

        // Add isFeatured column to lists table if it doesn't exist
        const listsTableExists = await queryRunner.hasTable('lists');
        if (listsTableExists) {
            const hasFeaturedColumn = await queryRunner.hasColumn('lists', 'isFeatured');
            if (!hasFeaturedColumn) {
                await queryRunner.query(`
                    ALTER TABLE "lists" 
                    ADD COLUMN "isFeatured" boolean NOT NULL DEFAULT false
                `);
            }
        }

        // Insert default system configurations if the table exists
        try {
            const systemConfigsTableExists = await queryRunner.hasTable('system_configs');
            if (systemConfigsTableExists) {
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
        } catch (error) {
            console.error('Error inserting default system configurations:', error.message);
            // Continue with the migration even if insertions fail
        }
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        // Remove isFeatured column from lists
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

        // We don't drop the admin tables here as they are core to the application
        // This would normally be destructive in a migration's down method
    }
}
