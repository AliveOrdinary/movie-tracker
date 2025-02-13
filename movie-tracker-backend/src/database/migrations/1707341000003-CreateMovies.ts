import { MigrationInterface, QueryRunner, Table, TableIndex } from 'typeorm';

export class CreateMovies1707341000003 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.createTable(
      new Table({
        name: 'movies',
        columns: [
          {
            name: 'id',
            type: 'uuid',
            isPrimary: true,
            generationStrategy: 'uuid',
            default: 'uuid_generate_v4()',
          },
          {
            name: 'tmdbId',
            type: 'integer',
            isUnique: true,
          },
          {
            name: 'title',
            type: 'varchar',
          },
          {
            name: 'overview',
            type: 'text',
            isNullable: true,
          },
          {
            name: 'posterPath',
            type: 'varchar',
            isNullable: true,
          },
          {
            name: 'backdropPath',
            type: 'varchar',
            isNullable: true,
          },
          {
            name: 'releaseDate',
            type: 'varchar',
          },
          {
            name: 'voteAverage',
            type: 'decimal',
            precision: 4,
            scale: 2,
            isNullable: true,
          },
          {
            name: 'voteCount',
            type: 'integer',
            isNullable: true,
          },
          {
            name: 'genres',
            type: 'text',
            isArray: true,
            default: "'{}'",
          },
          {
            name: 'isPopular',
            type: 'boolean',
            default: false,
          },
          {
            name: 'tmdbData',
            type: 'jsonb',
            isNullable: true,
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

    // Create index on tmdbId
    await queryRunner.createIndex(
      'movies',
      new TableIndex({
        name: 'IDX_MOVIES_TMDB_ID',
        columnNames: ['tmdbId'],
        isUnique: true,
      })
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.dropIndex('movies', 'IDX_MOVIES_TMDB_ID');
    await queryRunner.dropTable('movies');
  }
}