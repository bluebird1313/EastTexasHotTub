import * as dotenv from 'dotenv';
import { EnhancedQuickBooksClient } from '../../integrations/quickbooks/client';
import { EnhancedSupabaseClient } from '../../integrations/supabase/client';
import { generateDemoData } from './demoData';

// Load environment variables
dotenv.config();

/**
 * ETL service to sync data between QuickBooks and Supabase
 */
export class SyncService {
  private qbClient: EnhancedQuickBooksClient | null = null;
  private supabaseClient: EnhancedSupabaseClient;
  private useDemoData: boolean = false;
  
  constructor() {
    // Set up Supabase client
    this.supabaseClient = new EnhancedSupabaseClient();
    
    // Check if we have QuickBooks credentials
    if (!process.env.QBO_CLIENT_ID || !process.env.QBO_CLIENT_SECRET || !process.env.REALMID) {
      console.warn('QuickBooks credentials not found in environment. Using demo data instead.');
      this.useDemoData = true;
    } else {
      try {
        this.qbClient = new EnhancedQuickBooksClient();
      } catch (error) {
        console.error('Failed to initialize QuickBooks client:', error);
        console.warn('Falling back to demo data');
        this.useDemoData = true;
      }
    }
  }
  
  /**
   * Sync all financial data from QuickBooks to Supabase
   */
  async syncAllData(): Promise<boolean> {
    try {
      console.log('Starting full data sync');
      
      // Get the date range for the sync
      const endDate = new Date().toISOString().split('T')[0]; // Today
      
      // Default to last 30 days
      const startDate = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)
        .toISOString().split('T')[0];
      
      // Sync financial data
      const success = await this.syncFinancialData(startDate, endDate);
      
      console.log('Full data sync completed');
      return success;
    } catch (error) {
      console.error('Error during full data sync:', error);
      return false;
    }
  }
  
  /**
   * Sync financial data for a specific date range
   */
  async syncFinancialData(startDate: string, endDate: string): Promise<boolean> {
    try {
      console.log(`Syncing financial data from ${startDate} to ${endDate}`);
      
      let financialData;
      
      // Use demo data or fetch from QuickBooks
      if (this.useDemoData) {
        console.log('Using demo data for financial sync');
        financialData = { data: generateDemoData() };
      } else if (this.qbClient) {
        // Fetch data from QuickBooks
        financialData = await this.qbClient.fetchFinancialData(startDate, endDate);
      } else {
        throw new Error('No data source available');
      }
      
      // Transform the data for Supabase
      const transformedData = this.transformFinancialData(financialData);
      
      // Store in Supabase
      const success = await this.supabaseClient.storeFinancialData(
        transformedData, 
        'invoices'
      );
      
      console.log(`Financial data sync ${success ? 'completed' : 'failed'}`);
      return success;
    } catch (error) {
      console.error('Error syncing financial data:', error);
      return false;
    }
  }
  
  /**
   * Transform financial data from QuickBooks format to Supabase format
   */
  private transformFinancialData(data: any): any[] {
    // For demonstration purposes, returning a placeholder
    // In reality, this would map QB fields to Supabase fields
    
    if (!data || !data.data) {
      return [];
    }
    
    return data.data.map((item: any) => ({
      qb_id: item.Id || item.qb_id || `qb-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
      date: item.TxnDate || item.date,
      document_number: item.DocNumber || item.document_number,
      description: item.Description || item.description,
      amount: item.Amount || item.amount,
      cost: item.Cost || item.cost || null,
      price: item.Price || item.price || item.Amount || item.amount,
      item_name: item.ItemName || item.item_name,
      item_type: item.ItemType || item.item_type,
      // Add other fields as needed
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    }));
  }
} 