import * as dotenv from 'dotenv';
import { EnhancedQuickBooksClient } from '../../integrations/quickbooks/client';
import { EnhancedSupabaseClient } from '../../integrations/supabase/client';

// Load environment variables
dotenv.config();

/**
 * ETL service to sync data between QuickBooks and Supabase
 */
export class SyncService {
  private qbClient: EnhancedQuickBooksClient;
  private supabaseClient: EnhancedSupabaseClient;
  
  constructor() {
    this.qbClient = new EnhancedQuickBooksClient();
    this.supabaseClient = new EnhancedSupabaseClient();
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
      
      // Fetch data from QuickBooks
      const financialData = await this.qbClient.fetchFinancialData(startDate, endDate);
      
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
      qb_id: item.Id || `qb-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
      date: item.TxnDate,
      document_number: item.DocNumber,
      description: item.Description,
      amount: item.Amount,
      item_name: item.ItemName,
      item_type: item.ItemType,
      // Add other fields as needed
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    }));
  }
} 