// NOTE: This is a Supabase Edge Function that runs on Deno, not Node.js.
// It will be deployed to Supabase and won't be run directly in this project.
// The linter errors for Deno imports can be safely ignored.

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const supabaseUrl = Deno.env.get('SUPABASE_URL') as string;
const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE') as string;

// Initialize Supabase client
const supabase = createClient(supabaseUrl, supabaseServiceKey);

// Mock QuickBooks client for demonstration
const fetchQBData = async (startDate: string, endDate: string) => {
  console.log(`Fetching QuickBooks data from ${startDate} to ${endDate}`);
  
  // This would normally call the QuickBooks API
  // Return mock data for now
  return [
    {
      Id: 'qb-1001',
      TxnDate: '2023-05-15',
      DocNumber: 'INV-1001',
      Description: 'Hot Tub Sale - Deluxe Model',
      Amount: 5999.99,
      ItemName: 'Deluxe Hot Tub',
      ItemType: 'Hot Tub'
    },
    {
      Id: 'qb-1002',
      TxnDate: '2023-05-18',
      DocNumber: 'INV-1002',
      Description: 'Hot Tub Maintenance',
      Amount: 149.99,
      ItemName: 'Maintenance Service',
      ItemType: 'Service'
    }
  ];
};

// Transform the QuickBooks data to match our schema
const transformData = (items: any[]) => {
  return items.map(item => ({
    qb_id: item.Id,
    date: item.TxnDate,
    document_number: item.DocNumber,
    description: item.Description,
    amount: item.Amount,
    item_name: item.ItemName,
    item_type: item.ItemType,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  }));
};

// Store the transformed data in Supabase
const storeInSupabase = async (data: any[]) => {
  const { error } = await supabase
    .from('financial_invoices')
    .upsert(data, { onConflict: 'qb_id' });
  
  if (error) {
    throw error;
  }
  
  return { success: true, count: data.length };
};

// Main handler function
serve(async (req) => {
  try {
    // Get dates from request or use defaults
    const url = new URL(req.url);
    const startDate = url.searchParams.get('startDate') || 
      new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
    const endDate = url.searchParams.get('endDate') || 
      new Date().toISOString().split('T')[0];
    
    // Fetch data from QuickBooks
    const qbData = await fetchQBData(startDate, endDate);
    
    // Transform the data
    const transformedData = transformData(qbData);
    
    // Store in Supabase
    const result = await storeInSupabase(transformedData);
    
    return new Response(
      JSON.stringify({ message: `Synced ${result.count} records`, count: result.count }),
      { headers: { 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Error syncing data:', error);
    
    return new Response(
      JSON.stringify({ success: false, error: error.message }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
}); 