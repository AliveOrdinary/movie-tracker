import { MigrationInterface, QueryRunner, Table, TableIndex } from 'typeorm';

export class CreateUsers1707341000000 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    // First, enable uuid-ossp extension if not enabled
    await queryRunner.query(`CREATE EXTENSION IF NOT EXISTS "uuid-ossp"`);

    // Create the enum type
    await queryRunner.query(`
      CREATE TYPE user_role_enum AS ENUM ('user', 'admin', 'moderator')
    `);

    // Create the users table with the correct column name
    await queryRunner.createTable(
      new Table({
        name: 'users',
        columns: [
          {
            name: 'id',
            type: 'uuid',
            isPrimary: true,
            generationStrategy: 'uuid',
            default: 'uuid_generate_v4()',
          },
          {
            name: 'firebaseUid',  // Changed from firebase_uid to match entity
            type: 'varchar',
            isUnique: true,
          },
          {
            name: 'username',
            type: 'varchar',
          },
          {
            name: 'email',
            type: 'varchar',
            isUnique: true,
          },
          {
            name: 'roles',
            type: 'user_role_enum',
            isArray: true,
            default: "'{user}'",
          },
          {
            name: 'emailVerified',  // Changed from email_verified to match entity
            type: 'boolean',
            default: false,
          },
          {
            name: 'avatarUrl',  // Changed from avatar_url to match entity
            type: 'varchar',
            isNullable: true,
          },
          {
            name: 'createdAt',  // Changed from created_at to match entity
            type: 'timestamp',
            default: 'CURRENT_TIMESTAMP',
          },
          {
            name: 'updatedAt',  // Changed from updated_at to match entity
            type: 'timestamp',
            default: 'CURRENT_TIMESTAMP',
          },
          {
            name: 'lastLoginAt',  // Changed from last_login_at to match entity
            type: 'timestamp',
            isNullable: true,
          },
        ],
      }),
      true,
    );

    // Now create the index after the table exists
    await queryRunner.createIndex(
      'users',
      new TableIndex({
        name: 'IDX_USERS_FIREBASE_UID',
        columnNames: ['firebaseUid'],
      })
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Drop in reverse order
    await queryRunner.dropIndex('users', 'IDX_USERS_FIREBASE_UID');
    await queryRunner.dropTable('users');
    await queryRunner.query(`DROP TYPE user_role_enum`);
  }
}
