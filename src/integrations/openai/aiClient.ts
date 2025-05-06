import * as dotenv from 'dotenv';
import OpenAI from 'openai';

// Load environment variables
dotenv.config();

/**
 * Client for interacting with OpenAI API
 * Handles conversion of natural language to SQL queries
 */
export class OpenAIClient {
  private openai: OpenAI;
  
  constructor() {
    const apiKey = process.env.OPENAI_API_KEY;
    
    if (!apiKey) {
      throw new Error('OPENAI_API_KEY is not set in the environment');
    }
    
    this.openai = new OpenAI({
      apiKey: apiKey
    });
  }
  
  /**
   * Convert a natural language query to SQL
   */
  async convertToSQL(query: string, tableSchema: string): Promise<string> {
    try {
      console.log(`Converting natural language query to SQL: ${query}`);
      
      const response = await this.openai.chat.completions.create({
        model: "gpt-4o",
        messages: [
          {
            role: "system",
            content: 
            `You are a SQL expert that converts natural language queries to SQL.
            
            The database has the following schema:
            ${tableSchema}
            
            Generate only valid PostgreSQL that will run in Supabase. 
            Return only the SQL query with no explanations or markdown formatting.
            Focus especially on financial queries involving revenue, margins, and sales data.
            For "margin" queries, calculate the margin using the formula: (price - cost) / price * 100`
          },
          {
            role: "user",
            content: query
          }
        ],
        temperature: 0,
        max_tokens: 500
      });
      
      const sqlQuery = response.choices[0]?.message.content?.trim() || '';
      console.log(`Generated SQL query: ${sqlQuery}`);
      
      return sqlQuery;
    } catch (error) {
      console.error('Error converting query to SQL:', error);
      throw error;
    }
  }
  
  /**
   * Format the SQL query results into a human-readable response
   */
  async formatResponse(query: string, results: any): Promise<string> {
    try {
      console.log(`Formatting results for query: ${query}`);
      
      const response = await this.openai.chat.completions.create({
        model: "gpt-4o",
        messages: [
          {
            role: "system",
            content: 
            `You are a financial analyst providing clear, concise answers based on database query results.
            Explain the results in a professional but conversational tone.
            Focus on the key insights and relevant numbers.
            For revenue and margin questions, highlight the most important figures.
            Keep your response under 200 words.`
          },
          {
            role: "user",
            content: `Query: "${query}"\n\nResults: ${JSON.stringify(results, null, 2)}`
          }
        ],
        temperature: 0.7,
        max_tokens: 300
      });
      
      const formattedResponse = response.choices[0]?.message.content?.trim() || 'No response generated';
      return formattedResponse;
    } catch (error) {
      console.error('Error formatting response:', error);
      throw error;
    }
  }
} 