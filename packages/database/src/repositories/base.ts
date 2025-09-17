import type { TypedSupabaseClient } from '../client';
import type { BaseEntity } from '@wedsync/types';

export abstract class BaseRepository<T extends BaseEntity> {
  protected supabase: TypedSupabaseClient;
  protected tableName: string;

  constructor(supabase: TypedSupabaseClient, tableName: string) {
    this.supabase = supabase;
    this.tableName = tableName;
  }

  async findById(id: string): Promise<T | null> {
    const { data, error } = await this.supabase
      .from(this.tableName)
      .select('*')
      .eq('id', id)
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        return null; // Not found
      }
      throw error;
    }

    return data as T;
  }

  async findMany(options?: {
    limit?: number;
    offset?: number;
    orderBy?: { column: string; ascending?: boolean };
  }): Promise<T[]> {
    let query = this.supabase
      .from(this.tableName)
      .select('*');

    if (options?.limit) {
      query = query.limit(options.limit);
    }

    if (options?.offset) {
      query = query.range(options.offset, options.offset + (options.limit || 10) - 1);
    }

    if (options?.orderBy) {
      query = query.order(options.orderBy.column, { 
        ascending: options.orderBy.ascending ?? true 
      });
    }

    const { data, error } = await query;

    if (error) {
      throw error;
    }

    return data as T[];
  }

  async create(input: Omit<T, 'id' | 'createdAt' | 'updatedAt'>): Promise<T> {
    const { data, error } = await this.supabase
      .from(this.tableName)
      .insert(input)
      .select()
      .single();

    if (error) {
      throw error;
    }

    return data as T;
  }

  async update(id: string, input: Partial<Omit<T, 'id' | 'createdAt' | 'updatedAt'>>): Promise<T> {
    const { data, error } = await this.supabase
      .from(this.tableName)
      .update(input)
      .eq('id', id)
      .select()
      .single();

    if (error) {
      throw error;
    }

    return data as T;
  }

  async delete(id: string): Promise<void> {
    const { error } = await this.supabase
      .from(this.tableName)
      .delete()
      .eq('id', id);

    if (error) {
      throw error;
    }
  }

  async count(filters?: Record<string, any>): Promise<number> {
    let query = this.supabase
      .from(this.tableName)
      .select('*', { count: 'exact', head: true });

    if (filters) {
      Object.entries(filters).forEach(([key, value]) => {
        query = query.eq(key, value);
      });
    }

    const { count, error } = await query;

    if (error) {
      throw error;
    }

    return count || 0;
  }

  async exists(id: string): Promise<boolean> {
    const { count, error } = await this.supabase
      .from(this.tableName)
      .select('*', { count: 'exact', head: true })
      .eq('id', id);

    if (error) {
      throw error;
    }

    return (count || 0) > 0;
  }
}