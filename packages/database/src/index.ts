// Client exports
export {
  createSupabaseClient,
  createServiceRoleClient,
  initializeSupabase,
  getSupabaseClient,
  supabase
} from './client';

export type { TypedSupabaseClient } from './client';

// Database types
export type { Database, Json } from './types/database';

// Repository exports
export { BaseRepository } from './repositories/base';

// Re-export Supabase types and utilities
export type {
  User,
  Session,
  AuthError,
  PostgrestError
} from '@supabase/supabase-js';