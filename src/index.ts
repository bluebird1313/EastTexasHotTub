import * as dotenv from 'dotenv';
import { EnhancedQuickBooksClient } from './integrations/quickbooks/client';
import { EnhancedSupabaseClient } from './integrations/supabase/client';
import { SlackBot } from './integrations/slack/bot';
import { SyncService } from './services/etl/syncService';
import { QueryService } from './services/ai-query/queryService';

// Load environment variables
dotenv.config();

// Initialize services
const qbClient = new EnhancedQuickBooksClient();
const supabaseClient = new EnhancedSupabaseClient();
const slackBot = new SlackBot();
const syncService = new SyncService();
const queryService = new QueryService();

// Example usage: Process a sample query
async function runSampleQuery() {
  try {
    console.log('Running sample query...');
    
    const query = 'What was the revenue for hot tubs last month?';
    console.log(`Query: ${query}`);
    
    const result = await queryService.processQuery(query);
    console.log('Result:', result);
    
    return result;
  } catch (error) {
    console.error('Error running sample query:', error);
    throw error;
  }
}

// Example usage: Sync financial data
async function runDataSync() {
  try {
    console.log('Starting financial data sync...');
    
    // Get the current date and 30 days ago
    const endDate = new Date().toISOString().split('T')[0];
    const startDate = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)
      .toISOString().split('T')[0];
    
    console.log(`Syncing data from ${startDate} to ${endDate}`);
    
    const success = await syncService.syncFinancialData(startDate, endDate);
    console.log(`Sync ${success ? 'completed successfully' : 'failed'}`);
    
    return success;
  } catch (error) {
    console.error('Error syncing data:', error);
    throw error;
  }
}

// Example usage: Process a Slack message
async function handleSlackMessage(message: string, userId: string) {
  try {
    console.log(`Processing Slack message from ${userId}: ${message}`);
    
    const response = await slackBot.processMessage(message, userId);
    console.log(`Response: ${response}`);
    
    return response;
  } catch (error) {
    console.error('Error handling Slack message:', error);
    throw error;
  }
}

// Main function to demonstrate the functionality
async function main() {
  try {
    // Check if we have a command line argument
    const args = process.argv.slice(2);
    const command = args[0];
    
    switch (command) {
      case 'sync':
        await runDataSync();
        break;
      case 'query':
        const query = args[1] || 'What was the revenue for hot tubs last month?';
        await queryService.processQuery(query);
        break;
      case 'slack':
        const message = args[1] || 'What was the revenue for hot tubs last month?';
        await handleSlackMessage(message, 'test-user');
        break;
      default:
        console.log('Available commands:');
        console.log('  sync - Sync financial data from QuickBooks to Supabase');
        console.log('  query [text] - Process a natural language query');
        console.log('  slack [text] - Simulate a Slack message');
    }
  } catch (error) {
    console.error('Error in main function:', error);
    process.exit(1);
  }
}

// Only run the main function if this file is executed directly
if (require.main === module) {
  main();
}

// Export the functions and services for use in other modules
export {
  qbClient,
  supabaseClient,
  slackBot,
  syncService,
  queryService,
  runSampleQuery,
  runDataSync,
  handleSlackMessage
}; 