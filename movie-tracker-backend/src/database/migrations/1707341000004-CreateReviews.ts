import { MigrationInterface, QueryRunner, Table, TableForeignKey, TableIndex } from 'typeorm';

export class CreateReviews1707341000004 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.createTable(
      new Table({
        name: 'reviews',
        columns: [
          {
            name: 'id',
            type: 'uuid',
            isPrimary: true,
            generationStrategy: 'uuid',
            default: 'uuid_generate_v4()',
          },
          {
            name: 'userId',
            type: 'uuid',
          },
          {
            name: 'movieId',
            type: 'uuid',
          },
          {
            name: 'rating',
            type: 'decimal',
            precision: 2,
            scale: 1,
          },
          {
            name: 'content',
            type: 'text',
          },
          {
            name: 'flagged',
            type: 'boolean',
            default: false,
          },
          {
            name: 'spoiler',
            type: 'boolean',
            default: false,
          },
          {
            name: 'createdAt',
            type: 'timestamp',
            default: 'CURRENT_TIMESTAMP',
          },
          {
            name: 'updatedAt',
            type: 'timestamp',
            default: 'CURRENT_TIMESTAMP',
          },
        ],
      }),
      true,
    );

    // Add foreign key for users
    await queryRunner.createForeignKey(
      'reviews',
      new TableForeignKey({
        name: 'FK_REVIEWS_USER',
        columnNames: ['userId'],
        referencedColumnNames: ['id'],
        referencedTableName: 'users',
        onDelete: 'CASCADE',
      }),
    );

    // Add foreign key for movies
    await queryRunner.createForeignKey(
      'reviews',
      new TableForeignKey({
        name: 'FK_REVIEWS_MOVIE',
        columnNames: ['movieId'],
        referencedColumnNames: ['id'],
        referencedTableName: 'movies',
        onDelete: 'CASCADE',
      }),
    );

    // Create indexes
    await queryRunner.createIndex(
      'reviews',
      new TableIndex({
        name: 'IDX_REVIEWS_USER_MOVIE',
        columnNames: ['userId', 'movieId'],
        isUnique: true,
      })
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.dropForeignKey('reviews', 'FK_REVIEWS_MOVIE');
    await queryRunner.dropForeignKey('reviews', 'FK_REVIEWS_USER');
    await queryRunner.dropIndex('reviews', 'IDX_REVIEWS_USER_MOVIE');
    await queryRunner.dropTable('reviews');
  }
}