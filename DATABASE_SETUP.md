# Database Setup Instructions

This project uses PostgreSQL with Drizzle ORM for database management.

## Option 1: Using Homebrew (Recommended for Mac)

### Install PostgreSQL
```bash
# Install PostgreSQL using Homebrew
brew install postgresql@15

# Start PostgreSQL service
brew services start postgresql@15

# Create a database
createdb wikicommonbase
```

### Setup Environment
```bash
# Copy environment file
cp .env.example .env.local

# Edit .env.local and set your database URL
# DATABASE_URL="postgresql://username:password@localhost:5432/wikicommonbase"
# For local development, you can often use:
DATABASE_URL="postgresql://$(whoami)@localhost:5432/wikicommonbase"
```

### Run Database Migrations
```bash
# Generate initial migration
npm run db:generate

# Push schema to database (development)
npm run db:push

# Or run migrations (production)
npm run db:migrate
```

## Option 2: Using Docker

### Start PostgreSQL Container
```bash
# Create and start PostgreSQL container
docker run --name wikicommonbase-postgres \
  -e POSTGRES_USER=wikiuser \
  -e POSTGRES_PASSWORD=wikipass \
  -e POSTGRES_DB=wikicommonbase \
  -p 5432:5432 \
  -d postgres:15

# Or use docker-compose (see docker-compose.yml)
docker-compose up -d postgres
```

### Setup Environment
```bash
# Edit .env.local
DATABASE_URL="postgresql://wikiuser:wikipass@localhost:5432/wikicommonbase"
```

### Run Database Migrations
```bash
# Generate initial migration
npm run db:generate

# Push schema to database (development)
npm run db:push
```

## Database Schema

The database includes:

### Tables
- **entries**: Stores highlighted text content with vector embeddings
  - `id` (UUID, primary key)
  - `data` (text content)
  - `metadata` (JSON with article, section, URL info)
  - `embedding` (vector for semantic search)
  - `created_at`, `updated_at` (timestamps)

### Extensions
- **pgvector**: For storing and querying vector embeddings

## Available Scripts

```bash
# Generate Drizzle schema from code
npm run db:generate

# Push schema to database (development)
npm run db:push

# Run migrations (production)
npm run db:migrate

# Open Drizzle Studio (database GUI)
npm run db:studio

# Reset database (careful!)
npm run db:reset
```

## Troubleshooting

### PostgreSQL Connection Issues
```bash
# Check if PostgreSQL is running
brew services list | grep postgresql

# Restart PostgreSQL service
brew services restart postgresql@15

# Check connection
psql wikicommonbase
```

### Docker Issues
```bash
# Check container status
docker ps

# View container logs
docker logs wikicommonbase-postgres

# Restart container
docker restart wikicommonbase-postgres
```

### Permission Issues
```bash
# Create user and database manually
psql postgres
CREATE USER wikiuser WITH PASSWORD 'wikipass';
CREATE DATABASE wikicommonbase OWNER wikiuser;
GRANT ALL PRIVILEGES ON DATABASE wikicommonbase TO wikiuser;
\q
```

## Production Setup

For production, consider:
- Using a managed PostgreSQL service (AWS RDS, Google Cloud SQL, etc.)
- Setting up connection pooling
- Configuring SSL connections
- Setting up read replicas for scaling

Example production DATABASE_URL:
```
DATABASE_URL="postgresql://user:pass@production-host:5432/dbname?ssl=true"
```