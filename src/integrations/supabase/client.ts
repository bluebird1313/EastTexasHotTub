import * as dotenv from 'dotenv';
import { SupabaseSync } from '../../mcp/supabaseSync';
import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { OpenAIClient } from '../openai/aiClient';

// Load environment variables
dotenv.config();

/**
 * Enhanced Supabase client for data storage and retrieval
 * Extends the base MCP Supabase client with additional functionality
 */
export class EnhancedSupabaseClient extends SupabaseSync {
  private supabaseClient: SupabaseClient;
  private openaiClient: OpenAIClient;
  private tableSchema: string;
  
  constructor() {
    super();
    const supabaseUrl = process.env.SUPABASE_URL;
    const supabaseKey = process.env.SUPABASE_SERVICE_ROLE;
    
    if (!supabaseUrl || !supabaseKey) {
      throw new Error('SUPABASE_URL or SUPABASE_SERVICE_ROLE is not set in the environment');
    }
    
    this.supabaseClient = createClient(supabaseUrl, supabaseKey);
    this.openaiClient = new OpenAIClient();
    
    // Define the financial_invoices table schema for SQL generation
    this.tableSchema = `
    CREATE TABLE financial_invoices (
      id BIGSERIAL PRIMARY KEY,
      qb_id TEXT UNIQUE NOT NULL,
      date DATE NOT NULL,
      document_number TEXT,
      description TEXT,
      amount DECIMAL(10, 2) NOT NULL,
      cost DECIMAL(10, 2), -- Cost of goods/services
      price DECIMAL(10, 2), -- Selling price
      item_name TEXT,
      item_type TEXT,
      created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
      updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
    );
    `;
  }
  
  /**
   * Store financial data in Supabase
   */
  async storeFinancialData(data: any[], dataType: string): Promise<boolean> {
    try {
      // Define the table based on data type
      const table = `financial_${dataType}`;
      
      // Store data in Supabase
      const { error } = await this.supabaseClient
        .from(table)
        .upsert(data, { onConflict: 'qb_id' });
      
      if (error) {
        throw error;
      }
      
      console.log(`Stored ${data.length} ${dataType} records in Supabase`);
      return true;
    } catch (error) {
      console.error(`Failed to store ${dataType} data:`, error);
      return false;
    }
  }
  
  /**
   * Execute a natural language query against the financial data
   */
  async executeNLQuery(query: string): Promise<any> {
    try {
      // Check if this is a direct SQL execution request
      if (query.startsWith('EXECUTE SQL:')) {
        // Extract the SQL query
        const sqlQuery = query.replace('EXECUTE SQL:', '').trim();
        return this.executeDirectSQL(sqlQuery);
      }
      
      console.log(`Executing natural language query: ${query}`);
      
      // Convert natural language to SQL using OpenAI
      const sqlQuery = await this.openaiClient.convertToSQL(query, this.tableSchema);
      
      // Execute the SQL query
      const results = await this.executeDirectSQL(sqlQuery);
      
      // Format results using OpenAI
      const formattedResponse = await this.openaiClient.formatResponse(query, results);
      
      // Return both the raw results and the formatted response
      return {
        rawResults: results,
        formattedResponse: formattedResponse
      };
    } catch (error) {
      console.error('Failed to execute query:', error);
      throw error;
    }
  }
  
  /**
   * Execute a direct SQL query against Supabase
   * Private method for internal use
   */
  private async executeDirectSQL(sqlQuery: string): Promise<any> {
    try {
      // Execute the SQL query using Supabase RPC
      const { data, error } = await this.supabaseClient.rpc('execute_query', {
        sql_query: sqlQuery
      });
      
      if (error) {
        throw error;
      }
      
      return data;
    } catch (error) {
      console.error('Failed to execute SQL query:', error);
      throw error;
    }
  }
} 