# @wedsync/database

Database schemas and utilities for the WedSync platform, built with Supabase.

## Features

- 🗄️ Complete database schema for WedSync platform
- 🔑 Type-safe Supabase client
- 🏗️ Base repository patterns
- 🔄 Database migrations
- 🌱 Seed data utilities

## Installation

```bash
pnpm add @wedsync/database
```

## Usage

### Initialize Supabase Client

```typescript
import { initializeSupabase } from '@wedsync/database';

const supabase = initializeSupabase(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);
```

### Using the Repository Pattern

```typescript
import { BaseRepository, getSupabaseClient } from '@wedsync/database';
import type { User } from '@wedsync/types';

class UserRepository extends BaseRepository<User> {
  constructor() {
    super(getSupabaseClient(), 'users');
  }

  async findByEmail(email: string): Promise<User | null> {
    const { data, error } = await this.supabase
      .from('users')
      .select('*')
      .eq('email', email)
      .single();

    if (error) return null;
    return data as User;
  }
}
```

## Database Schema

The database includes the following main entities:

- **Users**: Core user accounts with roles (admin, supplier, couple, guest)
- **Supplier Profiles**: Business information for wedding suppliers
- **Couple Profiles**: Wedding couple information and preferences
- **Weddings**: Wedding events with venues, dates, and settings
- **Guests**: Guest lists with RSVP status and dietary requirements
- **Forms**: Customizable forms with conditional logic
- **Journeys**: Automated workflow sequences
- **Messages**: Communication system with multiple channels

## Local Development

1. Start Supabase locally:
```bash
cd packages/database
supabase start
```

2. Run migrations:
```bash
pnpm db:migrate
```

3. Generate types:
```bash
pnpm db:generate-types
```

## Environment Variables

```env
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
```