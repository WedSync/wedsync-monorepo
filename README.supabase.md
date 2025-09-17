# Supabase Local Development Setup

This guide explains how to set up and use the local Supabase development environment for the WedSync platform.

## Prerequisites

- Docker and Docker Compose installed
- Node.js 18+ and pnpm installed
- Git

## Quick Start

1. **Start Supabase services:**
   ```bash
   npm run supabase:start
   ```

2. **Copy environment variables:**
   ```bash
   cp .env.local.example .env.local
   ```

3. **Access the services:**
   - API Gateway: http://localhost:8000
   - Database: localhost:5432
   - Auth API: http://localhost:9999
   - Realtime: ws://localhost:4000
   - Storage API: http://localhost:5000
   - Mail UI: http://localhost:9000 (Inbucket)

## Services Overview

### Core Services

- **PostgreSQL Database** (port 5432): Main database with extensions
- **PostgREST API** (port 3000): Auto-generated REST API from database schema
- **GoTrue Auth** (port 9999): Authentication and user management
- **Realtime** (port 4000): WebSocket connections for real-time features
- **Storage** (port 5000): File storage and image transformations
- **Kong Gateway** (port 8000): API gateway routing all services

### Development Services

- **Inbucket Mail** (port 9000): SMTP server with web interface for testing emails
- **ImgProxy** (port 5001): Image transformation service

## Available Commands

```bash
# Start all Supabase services
npm run supabase:start

# Stop all services
npm run supabase:stop

# Restart services (useful after config changes)
npm run supabase:restart

# View logs from all services
npm run supabase:logs

# Reset database (removes all data and volumes)
npm run supabase:db:reset
```

## Environment Variables

Key environment variables in `.env.local`:

- `NEXT_PUBLIC_SUPABASE_URL`: API Gateway URL (http://localhost:8000)
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`: Anonymous access key
- `SUPABASE_SERVICE_ROLE_KEY`: Service role key for admin operations
- `DATABASE_URL`: Direct database connection string

## Database Access

### Using psql
```bash
psql postgresql://postgres:your-super-secret-and-long-postgres-password@localhost:5432/postgres
```

### Using a Database Client
- Host: localhost
- Port: 5432
- Database: postgres
- Username: postgres
- Password: your-super-secret-and-long-postgres-password

## Authentication

The local setup includes:
- Anonymous access (anon role)
- Authenticated users (authenticated role)
- Service role for admin operations

JWT tokens are validated using the configured secret.

## File Storage

Files are stored locally in `./volumes/storage/` directory. The storage API provides:
- File upload/download
- Image transformations via ImgProxy
- Access control based on RLS policies

## Email Testing

Emails are captured by Inbucket and can be viewed at:
http://localhost:9000

No actual emails are sent during development.

## Real-time Features

Real-time subscriptions work via WebSocket connections to:
ws://localhost:4000

## Row Level Security (RLS)

The database is configured with:
- Default RLS enabled on all tables
- Roles: anon, authenticated, service_role
- JWT-based access control

## Troubleshooting

### Services Won't Start
```bash
# Check if ports are in use
lsof -i :8000,5432,9999,4000,5000

# View detailed logs
npm run supabase:logs

# Reset everything
npm run supabase:db:reset
```

### Permission Issues
```bash
# Fix volume permissions
sudo chown -R $USER:$USER volumes/
```

### Database Connection Issues
- Verify the database is running: `docker ps`
- Check connection string in `.env.local`
- Ensure no other PostgreSQL instances are using port 5432

## Next Steps

After starting Supabase:

1. Set up database schemas (Task T013-T025)
2. Configure Row Level Security policies
3. Create migration files
4. Set up the Next.js applications to connect to Supabase

## Production Considerations

This setup is for **development only**. For production:
- Use managed Supabase instance
- Configure proper secrets and certificates
- Set up proper backup and monitoring
- Use environment-specific configurations