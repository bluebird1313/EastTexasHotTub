import * as dotenv from 'dotenv';
import { EnhancedSupabaseClient } from '../../integrations/supabase/client';

// Load environment variables
dotenv.config();

/**
 * Service for processing natural language queries against financial data
 */
export class QueryService {
  private supabaseClient: EnhancedSupabaseClient;
  
  constructor() {
    this.supabaseClient = new EnhancedSupabaseClient();
  }
  
  /**
   * Process a natural language query and return the results
   */
  async processQuery(query: string): Promise<any> {
    try {
      console.log(`Processing query: ${query}`);
      
      // Use our enhanced Supabase client to execute the NL query
      const result = await this.supabaseClient.executeNLQuery(query);
      
      // Format the result for presentation
      return this.formatResult(result, query);
    } catch (error) {
      console.error('Error processing query:', error);
      throw error;
    }
  }
  
  /**
   * Format the query result based on the type of query
   */
  private formatResult(data: any, query: string): any {
    // If no data or empty array
    if (!data || (Array.isArray(data) && data.length === 0)) {
      return { message: "No data found for your query." };
    }
    
    // Determine query type and format accordingly
    if (query.toLowerCase().includes('revenue')) {
      return this.formatRevenueResult(data);
    }
    
    if (query.toLowerCase().includes('expense')) {
      return this.formatExpenseResult(data);
    }
    
    // Default formatting
    return {
      message: "Here's what I found",
      data: data
    };
  }
  
  /**
   * Format revenue query results
   */
  private formatRevenueResult(data: any): any {
    if (typeof data === 'object' && 'revenue' in data) {
      return {
        message: `The revenue was $${data.revenue.toLocaleString()}.`,
        amount: data.revenue,
        type: 'revenue'
      };
    }
    
    if (Array.isArray(data)) {
      const total = data.reduce((sum, item) => sum + (item.amount || 0), 0);
      return {
        message: `The total revenue was $${total.toLocaleString()}.`,
        amount: total,
        data: data,
        type: 'revenue'
      };
    }
    
    return {
      message: "Revenue data found",
      data: data,
      type: 'revenue'
    };
  }
  
  /**
   * Format expense query results
   */
  private formatExpenseResult(data: any): any {
    if (typeof data === 'object' && 'expense' in data) {
      return {
        message: `The expenses were $${data.expense.toLocaleString()}.`,
        amount: data.expense,
        type: 'expense'
      };
    }
    
    if (Array.isArray(data)) {
      const total = data.reduce((sum, item) => sum + (item.amount || 0), 0);
      return {
        message: `The total expenses were $${total.toLocaleString()}.`,
        amount: total,
        data: data,
        type: 'expense'
      };
    }
    
    return {
      message: "Expense data found",
      data: data,
      type: 'expense'
    };
  }
} 