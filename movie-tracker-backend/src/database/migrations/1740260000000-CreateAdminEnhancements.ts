import { MigrationInterface, QueryRunner } from "typeorm";

export class CreateAdminEnhancements1740260000000 implements MigrationInterface {
    name = 'CreateAdminEnhancements1740260000000'

    public async up(queryRunner: QueryRunner): Promise<void> {
        // Create admin_audit_logs table
        await queryRunner.query(`
            CREATE TYPE "public"."admin_action_type_enum" AS ENUM(
                'USER_CREATED', 'USER_UPDATED', 'USER_DELETED', 'USER_ROLE_CHANGED',
                'USER_MODERATED', 'CONTENT_MODERATED', 'REPORT_RESOLVED',
                'SYSTEM_SETTING_CHANGED', 'BULK_ACTION_PERFORMED'
            )
        `);

        await queryRunner.query(`
            CREATE TABLE "admin_audit_logs" (
                "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
                "admin_id" uuid NOT NULL,
                "actionType" "public"."admin_action_type_enum" NOT NULL,
                "action" character varying NOT NULL,
                "metadata" jsonb,
                "target_user_id" uuid,
                "ipAddress" character varying,
                "createdAt" TIMESTAMP NOT NULL DEFAULT now(),
                CONSTRAINT "PK_admin_audit_logs" PRIMARY KEY ("id")
            )
        `);

        await queryRunner.query(`
            CREATE INDEX "IDX_admin_audit_logs_admin_created" ON "admin_audit_logs" ("admin_id", "createdAt")
        `);

        await queryRunner.query(`
            CREATE INDEX "IDX_admin_audit_logs_action_created" ON "admin_audit_logs" ("actionType", "createdAt")
        `);

        // Create system_configs table
        await queryRunner.query(`
            CREATE TYPE "public"."config_category_enum" AS ENUM(
                'GENERAL', 'CONTENT', 'USERS', 'SOCIAL',
                'EMAIL', 'SECURITY', 'MODERATION', 'ANALYTICS', 'PERFORMANCE'
            )
        `);

        await queryRunner.query(`
            CREATE TABLE "system_configs" (
                "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
                "key" character varying NOT NULL,
                "value" text NOT NULL,
                "category" "public"."config_category_enum" NOT NULL DEFAULT 'GENERAL',
                "description" character varying NOT NULL,
                "isEncrypted" boolean NOT NULL DEFAULT false,
                "isSystem" boolean NOT NULL DEFAULT false,
                "dataType" character varying,
                "validationPattern" character varying,
                "createdAt" TIMESTAMP NOT NULL DEFAULT now(),
                "updatedAt" TIMESTAMP NOT NULL DEFAULT now(),
                CONSTRAINT "UQ_system_configs_key" UNIQUE ("key"),
                CONSTRAINT "PK_system_configs" PRIMARY KEY ("id")
            )
        `);

        await queryRunner.query(`
            CREATE INDEX "IDX_system_configs_category" ON "system_configs" ("category")
        `);

        // Create foreign key constraints
        await queryRunner.query(`
            ALTER TABLE "admin_audit_logs" 
            ADD CONSTRAINT "FK_admin_audit_logs_admin" 
            FOREIGN KEY ("admin_id") REFERENCES "users"("id") ON DELETE SET NULL
        `);

        await queryRunner.query(`
            ALTER TABLE "admin_audit_logs" 
            ADD CONSTRAINT "FK_admin_audit_logs_target_user" 
            FOREIGN KEY ("target_user_id") REFERENCES "users"("id") ON DELETE SET NULL
        `);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        // Drop foreign keys
        await queryRunner.query(`ALTER TABLE "admin_audit_logs" DROP CONSTRAINT "FK_admin_audit_logs_target_user"`);
        await queryRunner.query(`ALTER TABLE "admin_audit_logs" DROP CONSTRAINT "FK_admin_audit_logs_admin"`);

        // Drop indexes
        await queryRunner.query(`DROP INDEX "public"."IDX_system_configs_category"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_admin_audit_logs_action_created"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_admin_audit_logs_admin_created"`);

        // Drop tables
        await queryRunner.query(`DROP TABLE "system_configs"`);
        await queryRunner.query(`DROP TYPE "public"."config_category_enum"`);
        await queryRunner.query(`DROP TABLE "admin_audit_logs"`);
        await queryRunner.query(`DROP TYPE "public"."admin_action_type_enum"`);
    }
}
