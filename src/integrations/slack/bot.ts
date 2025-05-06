import * as dotenv from 'dotenv';
import { WebClient } from '@slack/web-api';
import { EnhancedSupabaseClient } from '../supabase/client';

// Load environment variables
dotenv.config();

/**
 * Slack bot for handling financial queries
 */
export class SlackBot {
  private supabaseClient: EnhancedSupabaseClient;
  private webClient: WebClient | undefined;
  
  constructor() {
    this.supabaseClient = new EnhancedSupabaseClient();
    
    // Initialize Slack Web API client if token is available
    if (process.env.SLACK_BOT_TOKEN) {
      this.webClient = new WebClient(process.env.SLACK_BOT_TOKEN);
    } else {
      console.warn('SLACK_BOT_TOKEN not set in environment. Slack messaging will be disabled.');
    }
  }
  
  /**
   * Process a query from Slack
   */
  async processMessage(query: string, userId: string, channelId?: string): Promise<any> {
    try {
      console.log(`Processing message from ${userId}: ${query}`);
      
      // Process the query using Supabase
      const result = await this.supabaseClient.executeNLQuery(query);
      
      // Format the response for Slack
      let response = `Results for "${query}":\n`;
      
      if (result.formattedResponse) {
        response += result.formattedResponse;
      } else {
        // Basic formatting for raw results
        if (typeof result.rawResults === 'object') {
          response += JSON.stringify(result.rawResults, null, 2);
        } else {
          response += result.rawResults;
        }
      }
      
      console.log(`Response: ${response}`);
      
      // If we have a channel ID, send the response back to Slack
      if (channelId && this.webClient) {
        await this.sendSlackMessage(channelId, response);
      }
      
      return response;
    } catch (error: unknown) {
      console.error('Error processing Slack message:', error);
      
      const errorMessage = `Sorry, I encountered an error processing your query: ${error instanceof Error ? error.message : 'Unknown error'}`;
      
      // Send error message back to Slack if possible
      if (channelId && this.webClient) {
        await this.sendSlackMessage(channelId, errorMessage);
      }
      
      return errorMessage;
    }
  }
  
  /**
   * Send a message to a Slack channel
   */
  private async sendSlackMessage(channelId: string, text: string): Promise<void> {
    try {
      if (!this.webClient) {
        console.warn('Cannot send Slack message: WebClient not initialized');
        return;
      }
      
      await this.webClient.chat.postMessage({
        channel: channelId,
        text: text,
        // Add any other message formatting options here
      });
      
      console.log(`Message sent to Slack channel ${channelId}`);
    } catch (error) {
      console.error('Error sending message to Slack:', error);
    }
  }
} 