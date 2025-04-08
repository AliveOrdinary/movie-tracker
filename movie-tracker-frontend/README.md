# CineTrack Frontend

CineTrack is a web application for movie enthusiasts to discover, track, and share their favorite movies. This repository contains the frontend implementation built with Next.js, TypeScript, and GraphQL.

## Getting Started

First, install dependencies:

```bash
npm install
```

Then, run the development server:

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the application.

## Core Features

- **Authentication**: User signup, login, email verification, and password recovery
- **Movie Discovery**: Browse, search, and filter movies from TMDB
- **Lists**: Create, manage, and share movie lists
- **Watch History**: Track movies you've watched
- **Reviews**: Review and rate movies
- **Social Features**: Follow other users, activity feed, and more

## Development

### GraphQL Code Generation

The project uses GraphQL Code Generator to create TypeScript types from the GraphQL schema:

```bash
npm run codegen
```

### Linting

```bash
npm run lint
```

### Validation

Run both codegen and linting:

```bash
npm run validate
```

### Build for Production

```bash
npm run build
```

## Architecture

The application is built using:

- **Next.js**: React framework with App Router
- **TypeScript**: For type safety
- **Apollo Client**: GraphQL client for data fetching
- **shadcn/ui**: UI component library
- **TailwindCSS**: Utility-first CSS framework
- **Zod**: Schema validation for forms
- **Firebase Auth**: Authentication provider

## Project Structure

```
src/
├── app/                  # Next.js app router pages
│   ├── auth/             # Authentication routes
│   ├── lists/            # List management routes
│   ├── movies/           # Movie discovery and details
│   └── layout.tsx        # Root layout
├── components/           # React components
├── hooks/                # Custom React hooks
├── lib/                  # Utilities & configurations
├── types/                # TypeScript type definitions
```

## GraphQL Schema Alignment

For details on how we align with the backend GraphQL schema, see [GRAPHQL_ALIGNMENT.md](./GRAPHQL_ALIGNMENT.md).
