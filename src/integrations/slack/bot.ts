import * as dotenv from 'dotenv';
import { EnhancedSupabaseClient } from '../supabase/client';

// Load environment variables
dotenv.config();

/**
 * Slack bot for handling financial queries
 */
export class SlackBot {
  private supabaseClient: EnhancedSupabaseClient;
  
  constructor() {
    this.supabaseClient = new EnhancedSupabaseClient();
  }
  
  /**
   * Process a message from Slack
   * This would be called by a webhook handler
   */
  async processMessage(message: string, userId: string): Promise<string> {
    try {
      console.log(`Processing message from ${userId}: ${message}`);
      
      // Check if this is a financial query
      if (this.isFinancialQuery(message)) {
        // Execute the query against Supabase
        const result = await this.supabaseClient.executeNLQuery(message);
        
        // Format the result for Slack
        return this.formatResponse(result, message);
      }
      
      // Default response for non-financial queries
      return "I'm your Hot Tub Financial Assistant. Ask me about your financial data!";
    } catch (error) {
      console.error('Error processing message:', error);
      return "Sorry, I encountered an error while processing your request.";
    }
  }
  
  /**
   * Determine if a message is a financial query
   */
  private isFinancialQuery(message: string): boolean {
    const financialKeywords = [
      'revenue', 'sales', 'profit', 'income',
      'expense', 'cost', 'hot tub', 'quarterly',
      'monthly', 'year', 'ytd', 'last month'
    ];
    
    return financialKeywords.some(keyword => 
      message.toLowerCase().includes(keyword.toLowerCase())
    );
  }
  
  /**
   * Format the response for Slack
   */
  private formatResponse(data: any, query: string): string {
    // If no data or empty array
    if (!data || (Array.isArray(data) && data.length === 0)) {
      return "I couldn't find any data matching your query.";
    }
    
    // Format for revenue queries
    if (query.toLowerCase().includes('revenue')) {
      if (typeof data === 'object' && 'revenue' in data) {
        return `The revenue was $${data.revenue.toLocaleString()}.`;
      }
      
      if (Array.isArray(data)) {
        const total = data.reduce((sum, item) => sum + (item.amount || 0), 0);
        return `The total revenue was $${total.toLocaleString()}.`;
      }
    }
    
    // Default formatting
    return `Here's what I found: ${JSON.stringify(data, null, 2)}`;
  }
} 