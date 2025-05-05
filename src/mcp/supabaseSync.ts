// Supabase synchronization for MCP
import * as dotenv from 'dotenv';
import { createClient, SupabaseClient } from '@supabase/supabase-js';

// Load environment variables
dotenv.config();

export class SupabaseSync {
  private supabase: SupabaseClient;
  
  constructor() {
    const supabaseUrl = process.env.SUPABASE_URL;
    const supabaseKey = process.env.SUPABASE_SERVICE_ROLE;
    
    if (!supabaseUrl || !supabaseKey) {
      throw new Error('SUPABASE_URL or SUPABASE_SERVICE_ROLE is not set in the environment');
    }
    
    this.supabase = createClient(supabaseUrl, supabaseKey);
  }
  
  /**
   * Test the connection to Supabase
   */
  async testConnection(): Promise<boolean> {
    try {
      const { data, error } = await this.supabase.from('_test_connection').select('*').limit(1);
      
      if (error) {
        console.error('Supabase connection test failed:', error);
        return false;
      }
      
      return true;
    } catch (error) {
      console.error('Failed to test Supabase connection:', error);
      return false;
    }
  }
  
  /**
   * Fetch data from a specified table
   */
  async fetchData(table: string, query: any = {}): Promise<any> {
    try {
      let queryBuilder = this.supabase.from(table).select('*');
      
      // Add filters if provided
      if (query.filters) {
        for (const [key, value] of Object.entries(query.filters)) {
          queryBuilder = queryBuilder.eq(key, value);
        }
      }
      
      // Add limit if provided
      if (query.limit) {
        queryBuilder = queryBuilder.limit(query.limit);
      }
      
      const { data, error } = await queryBuilder;
      
      if (error) {
        throw error;
      }
      
      return data;
    } catch (error) {
      console.error(`Failed to fetch data from ${table}:`, error);
      throw error;
    }
  }
} 