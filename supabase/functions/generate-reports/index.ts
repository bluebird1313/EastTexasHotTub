// NOTE: This is a Supabase Edge Function that runs on Deno, not Node.js.
// It will be deployed to Supabase and won't be run directly in this project.
// The linter errors for Deno imports can be safely ignored.

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { GoogleSpreadsheet } from 'https://esm.sh/google-spreadsheet@3.3.0';
import { JWT } from 'https://esm.sh/google-auth-library@8.7.0';

// Environment variables
const supabaseUrl = Deno.env.get('SUPABASE_URL') as string;
const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE') as string;
const googleSheetsClientEmail = Deno.env.get('GOOGLE_SHEETS_CLIENT_EMAIL') as string;
const googleSheetsPrivateKey = Deno.env.get('GOOGLE_SHEETS_PRIVATE_KEY')?.replace(/\\n/g, '\n') as string;
const googleSheetsReportId = Deno.env.get('GOOGLE_SHEETS_REPORT_ID') as string;
const slackWebhookUrl = Deno.env.get('SLACK_WEBHOOK_URL') as string;

// Initialize Supabase client
const supabase = createClient(supabaseUrl, supabaseServiceKey);

// Initialize Google auth
const googleAuth = new JWT({
  email: googleSheetsClientEmail,
  key: googleSheetsPrivateKey,
  scopes: ['https://www.googleapis.com/auth/spreadsheets'],
});

// Generate monthly revenue report
async function generateMonthlyRevenueReport(): Promise<any> {
  try {
    console.log('Generating monthly revenue report');
    
    // Determine date range for previous month
    const now = new Date();
    const startDate = new Date(now.getFullYear(), now.getMonth() - 1, 1)
      .toISOString().split('T')[0];
    const endDate = new Date(now.getFullYear(), now.getMonth(), 0)
      .toISOString().split('T')[0];
    
    // Get revenue data from Supabase
    const query = `
      SELECT 
        item_type, 
        SUM(amount) as revenue
      FROM 
        financial_invoices
      WHERE 
        date >= '${startDate}' AND date <= '${endDate}'
      GROUP BY 
        item_type
      ORDER BY 
        revenue DESC
    `;
    
    // Execute the query via Supabase
    const { data: revenueByType, error } = await supabase.rpc(
      'execute_query',
      { sql_query: query }
    );
    
    if (error) {
      throw error;
    }
    
    // Format month name
    const monthName = new Date(startDate).toLocaleString('default', { month: 'long' });
    const year = new Date(startDate).getFullYear();
    
    // Create Google Sheets report
    const doc = new GoogleSpreadsheet(googleSheetsReportId, googleAuth);
    await doc.loadInfo();
    
    // Create a new sheet for this report
    const sheetTitle = `Revenue Report - ${monthName} ${year}`;
    
    // Try to find existing sheet
    let sheet = doc.sheetsByTitle[sheetTitle];
    
    // Create if it doesn't exist
    if (!sheet) {
      sheet = await doc.addSheet({ title: sheetTitle });
    } else {
      // Clear existing data
      await sheet.clear();
    }
    
    // Format data for Google Sheets
    const headers = ['Product/Service Type', 'Revenue'];
    const rows = revenueByType.map((item: any) => ({
      'Product/Service Type': item.item_type,
      'Revenue': item.revenue
    }));
    
    // Set headers and add rows
    await sheet.setHeaderRow(headers);
    await sheet.addRows(rows);
    
    // Create sheet URL
    const reportUrl = `https://docs.google.com/spreadsheets/d/${googleSheetsReportId}/edit#gid=${sheet.sheetId}`;
    
    // Send notification to Slack if webhook URL is provided
    if (slackWebhookUrl) {
      await notifySlack(`📊 Monthly revenue report for ${monthName} ${year} is ready! View it here: ${reportUrl}`);
    }
    
    return {
      success: true,
      reportUrl,
      sheetTitle,
      rowCount: rows.length,
      period: {
        startDate,
        endDate,
        monthName,
        year
      }
    };
  } catch (error) {
    console.error('Error generating monthly revenue report:', error);
    throw error;
  }
}

// Send a notification to Slack
async function notifySlack(message: string): Promise<void> {
  try {
    await fetch(slackWebhookUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ text: message })
    });
  } catch (error) {
    console.error('Error sending Slack notification:', error);
  }
}

// Main handler
serve(async (req) => {
  try {
    // Check if this is a scheduled invocation
    const url = new URL(req.url);
    const isScheduled = url.searchParams.get('scheduled') === 'true';
    
    // Get report type from query params or default to monthly
    const reportType = url.searchParams.get('type') || 'monthly-revenue';
    
    // Generate the requested report
    let result;
    
    switch (reportType) {
      case 'monthly-revenue':
        result = await generateMonthlyRevenueReport();
        break;
      
      default:
        return new Response(
          JSON.stringify({ error: `Unknown report type: ${reportType}` }),
          { status: 400, headers: { 'Content-Type': 'application/json' } }
        );
    }
    
    return new Response(
      JSON.stringify(result),
      { headers: { 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Error handling request:', error);
    
    return new Response(
      JSON.stringify({ success: false, error: error.message }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
}); 