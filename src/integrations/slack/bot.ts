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
        // Execute the query against Supabase with OpenAI translation
        const result = await this.supabaseClient.executeNLQuery(message);
        
        // Return the formatted response from OpenAI
        if (result.formattedResponse) {
          return result.formattedResponse;
        }
        
        // Fallback to our own formatting if OpenAI formatting fails
        return this.formatResponse(result.rawResults, message);
      }
      
      // Default response for non-financial queries
      return "I'm your Hot Tub Financial Assistant. Ask me about your financial data! Try questions like:\n" +
        "- What was the revenue for hot tubs last month?\n" +
        "- Show me products with a margin greater than 20%\n" +
        "- What are the top 5 selling products this quarter?";
    } catch (error) {
      console.error('Error processing message:', error);
      return "Sorry, I encountered an error while processing your request. Please try again with a different question.";
    }
  }
  
  /**
   * Determine if a message is a financial query
   */
  private isFinancialQuery(message: string): boolean {
    const financialKeywords = [
      'revenue', 'sales', 'profit', 'income',
      'expense', 'cost', 'hot tub', 'quarterly',
      'monthly', 'year', 'ytd', 'last month',
      'margin', 'percentage', 'product', 'top',
      'highest', 'lowest', 'average', 'total'
    ];
    
    return financialKeywords.some(keyword => 
      message.toLowerCase().includes(keyword.toLowerCase())
    );
  }
  
  /**
   * Format the response for Slack (fallback if OpenAI formatting fails)
   */
  private formatResponse(data: any, query: string): string {
    // If no data or empty array
    if (!data || (Array.isArray(data) && data.length === 0)) {
      return "I couldn't find any data matching your query.";
    }
    
    // Format for revenue queries
    if (query.toLowerCase().includes('revenue') || 
        query.toLowerCase().includes('sales') || 
        query.toLowerCase().includes('income')) {
      if (typeof data === 'object' && 'revenue' in data) {
        return `The revenue was $${Number(data.revenue).toLocaleString()}.`;
      }
      
      if (Array.isArray(data)) {
        const total = data.reduce((sum, item) => sum + (Number(item.amount) || 0), 0);
        return `The total revenue was $${total.toLocaleString()}.`;
      }
    }
    
    // Format for margin queries
    if (query.toLowerCase().includes('margin')) {
      if (Array.isArray(data) && data.length > 0) {
        let response = "Here are the items with their margins:\n\n";
        
        data.forEach(item => {
          const itemName = item.item_name || item.description || 'Unknown product';
          const margin = item.margin || 
                        (item.price && item.cost ? 
                         ((item.price - item.cost) / item.price * 100).toFixed(2) : 
                         'N/A');
          
          response += `• ${itemName}: ${margin}% margin`;
          
          if (item.revenue || item.amount) {
            response += ` (Revenue: $${Number(item.revenue || item.amount).toLocaleString()})`;
          }
          
          response += '\n';
        });
        
        return response;
      }
    }
    
    // For small result sets, format as a list
    if (Array.isArray(data) && data.length <= 10) {
      let response = "Here's what I found:\n\n";
      
      data.forEach(item => {
        response += "• ";
        
        // Add key details based on what's available
        if (item.item_name || item.description) {
          response += (item.item_name || item.description);
        }
        
        if (item.amount || item.revenue) {
          response += `: $${Number(item.amount || item.revenue).toLocaleString()}`;
        }
        
        if (item.date) {
          response += ` (${item.date})`;
        }
        
        response += '\n';
      });
      
      return response;
    }
    
    // Default formatting for larger datasets - summarize
    if (Array.isArray(data)) {
      return `I found ${data.length} records matching your query. Here's a sample:\n\n` +
        data.slice(0, 3).map(item => 
          `• ${Object.entries(item)
            .filter(([key, value]) => value !== null && key !== 'id' && key !== 'qb_id')
            .map(([key, value]) => `${key}: ${value}`)
            .join(', ')}`
        ).join('\n');
    }
    
    // Default response
    return `Here's what I found: ${JSON.stringify(data, null, 2)}`;
  }
} 