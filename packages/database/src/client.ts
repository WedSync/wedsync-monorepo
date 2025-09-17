import { createClient, SupabaseClient } from '@supabase/supabase-js';
import type { Database } from './types/database';

export type TypedSupabaseClient = SupabaseClient<Database>;

export const createSupabaseClient = (
  supabaseUrl: string,
  supabaseKey: string,
  options?: {
    auth?: {
      autoRefreshToken?: boolean;
      persistSession?: boolean;
      detectSessionInUrl?: boolean;
    };
  }
): TypedSupabaseClient => {
  return createClient<Database>(supabaseUrl, supabaseKey, options);
};

export const createServiceRoleClient = (
  supabaseUrl: string,
  serviceRoleKey: string
): TypedSupabaseClient => {
  return createClient<Database>(supabaseUrl, serviceRoleKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });
};

// Default client instance (to be initialized by the application)
let supabase: TypedSupabaseClient | null = null;

export const initializeSupabase = (
  supabaseUrl: string,
  supabaseKey: string,
  options?: Parameters<typeof createSupabaseClient>[2]
): TypedSupabaseClient => {
  supabase = createSupabaseClient(supabaseUrl, supabaseKey, options);
  return supabase;
};

export const getSupabaseClient = (): TypedSupabaseClient => {
  if (!supabase) {
    throw new Error('Supabase client not initialized. Call initializeSupabase() first.');
  }
  return supabase;
};

export { supabase };

// Database helper functions
export const withErrorHandling = async <T>(
  operation: () => Promise<{ data: T; error: any }>
): Promise<T> => {
  const { data, error } = await operation();
  if (error) {
    throw new Error(error.message || 'Database operation failed');
  }
  return data;
};

export const withRetry = async <T>(
  operation: () => Promise<T>,
  maxRetries: number = 3,
  delay: number = 1000
): Promise<T> => {
  let lastError: Error;
  
  for (let attempt = 0; attempt < maxRetries; attempt++) {
    try {
      return await operation();
    } catch (error) {
      lastError = error as Error;
      if (attempt < maxRetries - 1) {
        await new Promise(resolve => setTimeout(resolve, delay * Math.pow(2, attempt)));
      }
    }
  }
  
  throw lastError!;
};

// Connection health check
export const healthCheck = async (): Promise<boolean> => {
  try {
    const client = getSupabaseClient();
    const { error } = await client.from('users').select('count').limit(1);
    return !error;
  } catch {
    return false;
  }
};