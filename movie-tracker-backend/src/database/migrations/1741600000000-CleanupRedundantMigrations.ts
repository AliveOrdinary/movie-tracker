import { MigrationInterface, QueryRunner } from "typeorm";

export class CleanupRedundantMigrations1741600000000 implements MigrationInterface {
    name = 'CleanupRedundantMigrations1741600000000'

    public async up(queryRunner: QueryRunner): Promise<void> {
        // Check if the migration table exists
        const migrationTableExists = await queryRunner.hasTable('migrations');
        if (!migrationTableExists) {
            console.log('Migrations table does not exist, skipping cleanup');
            return;
        }

        // List of redundant migrations to remove from the migrations table
        const redundantMigrations = [
            '1708463781234-CreateUsers',  // Redundant with 1707341000000-CreateUsers
            '1708380000000-UpdateMovieColumnNames', // Consolidated with 1708380000004-UpdateMovieColumns
        ];

        // Check if redundant migrations exist in the table before trying to delete
        for (const migration of redundantMigrations) {
            const exists = await queryRunner.query(`
                SELECT COUNT(*) 
                FROM migrations 
                WHERE name = $1
            `, [migration]);

            if (parseInt(exists[0].count) > 0) {
                // Remove the redundant migration from the migrations table
                await queryRunner.query(`
                    DELETE FROM migrations 
                    WHERE name = $1
                `, [migration]);
                console.log(`Removed redundant migration: ${migration}`);
            } else {
                console.log(`Migration ${migration} not found in migrations table, skipping`);
            }
        }
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        // This is a cleanup migration, no need to roll back
        console.log('No rollback necessary for migrations cleanup');
    }
}
