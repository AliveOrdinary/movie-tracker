import { MigrationInterface, QueryRunner } from "typeorm";

export class MakeMovieQueriesPublic1741900000002 implements MigrationInterface {
    name = 'MakeMovieQueriesPublic1741900000002'

    public async up(queryRunner: QueryRunner): Promise<void> {
        console.log('Note: This migration does not modify the database schema.');
        console.log('Instead, it serves as documentation for code changes made to auth guards.');
        console.log('The following resolvers have been marked as @Public():');
        console.log('- popularMovies');
        console.log('- searchMovies');
        console.log('- movie');
        console.log('- moviesByGenre');
        console.log('- similarMovies');
        console.log('- recommendedMovies');
        console.log('- movieGenres');
        console.log('- nowPlayingMovies');
        console.log('- upcomingMovies');
        console.log('- topRatedMovies');
        console.log('- trendingMovies');
        console.log('The @Public() decorator has been added to these queries to bypass authentication requirements.');
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        console.log('No database changes to roll back for this migration.');
    }
}