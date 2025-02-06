# Movie Tracker

A web application for tracking movies and TV shows, built with NestJS, Next.js, and GraphQL.

## Features

- User authentication
- Movie/TV show tracking
- Watchlist management
- Reviews and ratings
- Social features

## Tech Stack

### Backend
- NestJS
- GraphQL
- TypeORM
- PostgreSQL
- Redis

### Frontend
- Next.js 14
- TailwindCSS
- Apollo Client
- React Query

## Getting Started

### Prerequisites

- Node.js 18+
- Docker and Docker Compose
- TMDB API key

### Installation

1. Clone the repository
```bash
git clone https://github.com/AliveOrdinary/movie-tracker.git
cd movie-tracker
```

2. Install dependencies
```bash
npm install
```

3. Set up environment variables
```bash
cp .env.example .env
# Edit .env with your configuration
```

4. Start the database
```bash
docker-compose up -d
```

5. Start the development server
```bash
npm run start:dev
```

## Project Structure

```
src/
├── main.ts
├── app.module.ts
├── common/
│   ├── decorators/
│   ├── guards/
│   └── interceptors/
├── config/
│   └── configuration.ts
├── modules/
│   ├── users/
│   ├── movies/
│   ├── watches/
│   ├── reviews/
│   └── lists/
└── shared/
    ├── interfaces/
    ├── dto/
    └── utils/
```

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.