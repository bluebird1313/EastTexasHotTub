// NOTE: This is a Supabase Edge Function that runs on Deno, not Node.js.
// It will be deployed to Supabase and won't be run directly in this project.
// The linter errors for Deno imports can be safely ignored.

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const supabaseUrl = Deno.env.get('SUPABASE_URL') as string;
const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE') as string;
const slackToken = Deno.env.get('SLACK_BOT_TOKEN') as string;

// Initialize Supabase client
const supabase = createClient(supabaseUrl, supabaseServiceKey);

// Process a financial query
const processFinancialQuery = async (query: string): Promise<string> => {
  try {
    console.log(`Processing financial query: ${query}`);
    
    // Check if this is a revenue query for hot tubs
    if (query.toLowerCase().includes('revenue') && 
        query.toLowerCase().includes('hot tub') &&
        query.toLowerCase().includes('last month')) {
      
      // Call the stored function
      const { data, error } = await supabase.rpc('get_hot_tub_revenue_last_month');
      
      if (error) {
        throw error;
      }
      
      if (data && data.length > 0) {
        const revenue = data[0].revenue;
        return `The revenue for hot tubs last month was $${revenue.toLocaleString()}.`;
      }
      
      return "I couldn't find any hot tub revenue data for last month.";
    }
    
    // For other types of revenue queries
    if (query.toLowerCase().includes('revenue')) {
      // Call function to get revenue by product type
      const { data, error } = await supabase.rpc('get_revenue_by_product_type');
      
      if (error) {
        throw error;
      }
      
      if (data && data.length > 0) {
        let response = "Here's the revenue by product type for last month:\n";
        
        for (const item of data) {
          response += `- ${item.item_type}: $${item.revenue.toLocaleString()}\n`;
        }
        
        return response;
      }
      
      return "I couldn't find any revenue data for the requested period.";
    }
    
    // Default response
    return "I can help answer questions about your hot tub business finances. Try asking about revenue for hot tubs last month.";
  } catch (error) {
    console.error('Error processing query:', error);
    return "Sorry, I encountered an error while processing your request.";
  }
};

// Verify that the request came from Slack
const verifySlackRequest = (request: Request): boolean => {
  // In a real implementation, verify the Slack signature
  // For now, just check for the token
  const slackSigningSecret = Deno.env.get('SLACK_SIGNING_SECRET');
  
  // For demo purposes, allow any request
  return true;
};

// Main handler function
serve(async (req) => {
  try {
    // Verify this is a valid Slack request
    if (!verifySlackRequest(req)) {
      return new Response(
        JSON.stringify({ error: 'Invalid Slack request' }),
        { status: 401, headers: { 'Content-Type': 'application/json' } }
      );
    }
    
    // Parse the request body
    const requestBody = await req.json();
    
    // Check if this is a Slack event
    if (requestBody.type === 'url_verification') {
      // Respond to Slack's challenge
      return new Response(
        JSON.stringify({ challenge: requestBody.challenge }),
        { headers: { 'Content-Type': 'application/json' } }
      );
    }
    
    // Handle message events
    if (requestBody.event && requestBody.event.type === 'message') {
      const message = requestBody.event.text;
      const userId = requestBody.event.user;
      
      // Process the financial query
      const response = await processFinancialQuery(message);
      
      // Send the response back to Slack
      // In a real implementation, this would post a message to the Slack API
      // For now, just return the response
      return new Response(
        JSON.stringify({ response }),
        { headers: { 'Content-Type': 'application/json' } }
      );
    }
    
    // Default response
    return new Response(
      JSON.stringify({ status: 'ok' }),
      { headers: { 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Error handling webhook:', error);
    
    return new Response(
      JSON.stringify({ success: false, error: error.message }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
}); 