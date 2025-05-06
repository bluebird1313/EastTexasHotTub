// NOTE: This is a Supabase Edge Function that runs on Deno, not Node.js.
// It will be deployed to Supabase and won't be run directly in this project.
// The linter errors for Deno imports can be safely ignored.

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { OpenAI } from 'https://esm.sh/openai@4.28.0';

// Environment variables
const supabaseUrl = Deno.env.get('SUPABASE_URL') as string;
const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE') as string;
const slackToken = Deno.env.get('SLACK_BOT_TOKEN') as string;
const slackSigningSecret = Deno.env.get('SLACK_SIGNING_SECRET') as string;
const openaiApiKey = Deno.env.get('OPENAI_API_KEY') as string;

// Initialize Supabase client
const supabase = createClient(supabaseUrl, supabaseServiceKey);

// Initialize OpenAI client
const openai = new OpenAI({
  apiKey: openaiApiKey
});

// Financial invoices table schema for SQL generation
const tableSchema = `
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

// Convert natural language to SQL using OpenAI
async function convertToSQL(query: string): Promise<string> {
  try {
    console.log(`Converting natural language query to SQL: ${query}`);
    
    const response = await openai.chat.completions.create({
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
    
    const sqlQuery = response.choices[0]?.message?.content?.trim() || '';
    console.log(`Generated SQL query: ${sqlQuery}`);
    
    return sqlQuery;
  } catch (error) {
    console.error('Error converting query to SQL:', error);
    throw error;
  }
}

// Format the SQL query results into a human-readable response
async function formatResponse(query: string, results: any): Promise<string> {
  try {
    console.log(`Formatting results for query: ${query}`);
    
    const response = await openai.chat.completions.create({
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
    
    const formattedResponse = response.choices[0]?.message?.content?.trim() || 'No response generated';
    return formattedResponse;
  } catch (error) {
    console.error('Error formatting response:', error);
    throw error;
  }
}

// Process a financial query
async function processFinancialQuery(query: string): Promise<string> {
  try {
    console.log(`Processing financial query: ${query}`);
    
    // Convert natural language to SQL using OpenAI
    const sqlQuery = await convertToSQL(query);
    
    // Execute the SQL query
    const { data, error } = await supabase.rpc('execute_query', {
      sql_query: sqlQuery
    });
    
    if (error) {
      throw error;
    }
    
    // Format the results using OpenAI
    return await formatResponse(query, data);
  } catch (error) {
    console.error('Error processing query:', error);
    return "Sorry, I encountered an error while processing your request. Please try again with a different question.";
  }
}

// Send a response back to Slack
async function respondToSlack(response_url: string, message: string) {
  try {
    await fetch(response_url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        text: message
      })
    });
  } catch (error) {
    console.error('Error sending response to Slack:', error);
  }
}

// Verify that the request came from Slack
const verifySlackRequest = (request: Request): boolean => {
  // In a real implementation, verify the Slack signature
  // For now, just check if the token exists
  return !!slackSigningSecret;
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
    
    // Handle slash commands
    if (requestBody.command === '/finance') {
      const query = requestBody.text;
      const response_url = requestBody.response_url;
      
      // Send an immediate response to acknowledge receipt
      const immediateResponse = new Response(
        JSON.stringify({ 
          response_type: 'ephemeral',
          text: "I'm processing your query. This may take a moment..."
        }),
        { headers: { 'Content-Type': 'application/json' } }
      );
      
      // Process the query asynchronously
      processFinancialQuery(query).then(response => {
        respondToSlack(response_url, response);
      });
      
      return immediateResponse;
    }
    
    // Handle message events
    if (requestBody.event && requestBody.event.type === 'message') {
      const message = requestBody.event.text;
      const userId = requestBody.event.user;
      
      // Check if this message mentions our bot
      const botUserId = requestBody.authed_users?.[0] || requestBody.authorizations?.[0]?.user_id;
      const isMentioned = botUserId && message.includes(`<@${botUserId}>`);
      
      if (isMentioned || requestBody.event.channel_type === 'im') {
        // Process the financial query
        const cleanMessage = message.replace(`<@${botUserId}>`, '').trim();
        const response = await processFinancialQuery(cleanMessage);
        
        // Post message back to Slack
        await fetch('https://slack.com/api/chat.postMessage', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${slackToken}`
          },
          body: JSON.stringify({
            channel: requestBody.event.channel,
            text: response
          })
        });
      }
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