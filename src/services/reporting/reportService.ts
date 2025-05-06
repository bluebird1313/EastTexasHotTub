import * as dotenv from 'dotenv';
import { EnhancedSupabaseClient } from '../../integrations/supabase/client';
import { GoogleSheetsClient } from '../../integrations/google/sheetsClient';
import { SlackBot } from '../../integrations/slack/bot';

// Load environment variables
dotenv.config();

/**
 * Service for generating financial reports in Google Sheets
 */
export class ReportService {
  private supabaseClient: EnhancedSupabaseClient;
  private sheetsClient: GoogleSheetsClient;
  private slackBot: SlackBot | null = null;
  
  constructor(useSlack = false) {
    this.supabaseClient = new EnhancedSupabaseClient();
    this.sheetsClient = new GoogleSheetsClient();
    
    // Optionally initialize Slack for notifications
    if (useSlack) {
      this.slackBot = new SlackBot();
    }
  }
  
  /**
   * Generate a monthly revenue report
   */
  async generateMonthlyRevenueReport(month: string): Promise<any> {
    try {
      console.log(`Generating monthly revenue report for ${month}`);
      
      // Determine date range
      let startDate: string;
      let endDate: string;
      
      if (month === 'current') {
        // First day of current month
        const now = new Date();
        startDate = new Date(now.getFullYear(), now.getMonth(), 1).toISOString().split('T')[0];
        endDate = new Date().toISOString().split('T')[0]; // Today
      } else if (month === 'previous') {
        // Previous month
        const now = new Date();
        startDate = new Date(now.getFullYear(), now.getMonth() - 1, 1).toISOString().split('T')[0];
        endDate = new Date(now.getFullYear(), now.getMonth(), 0).toISOString().split('T')[0];
      } else {
        // Parse custom month in format YYYY-MM
        const [year, monthNum] = month.split('-').map(Number);
        startDate = new Date(year, monthNum - 1, 1).toISOString().split('T')[0];
        endDate = new Date(year, monthNum, 0).toISOString().split('T')[0];
      }
      
      // Use the executeNLQuery method to query Supabase
      const sqlQuery = `
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
      
      // Execute the query using our NL query method as a workaround
      const revenueByType = await this.executeCustomQuery(sqlQuery);
      
      // Format for Google Sheets
      const headers = ['Product/Service Type', 'Revenue'];
      const formattedData = revenueByType.map((item: any) => ({
        'Product/Service Type': item.item_type,
        'Revenue': item.revenue
      }));
      
      // Create a title for the sheet
      const monthName = new Date(startDate).toLocaleString('default', { month: 'long' });
      const year = new Date(startDate).getFullYear();
      const sheetTitle = `Revenue Report - ${monthName} ${year}`;
      
      // Write to Google Sheets
      const result = await this.sheetsClient.writeFinancialData(
        sheetTitle,
        formattedData,
        headers
      );
      
      // Notify via Slack if enabled
      if (this.slackBot) {
        const message = `📊 Monthly revenue report for ${monthName} ${year} is ready! View it here: ${result.url}`;
        await this.slackBot.processMessage(message, 'system');
      }
      
      return {
        ...result,
        period: {
          start: startDate,
          end: endDate,
          name: `${monthName} ${year}`
        }
      };
    } catch (error) {
      console.error('Error generating monthly revenue report:', error);
      throw error;
    }
  }
  
  /**
   * Generate a quarterly sales report
   */
  async generateQuarterlySalesReport(quarter: string): Promise<any> {
    try {
      console.log(`Generating quarterly sales report for ${quarter}`);
      
      // Determine date range based on quarter
      let startDate: string;
      let endDate: string;
      let quarterName: string;
      
      if (quarter === 'current') {
        // Current quarter
        const now = new Date();
        const currentQuarter = Math.floor(now.getMonth() / 3);
        startDate = new Date(now.getFullYear(), currentQuarter * 3, 1).toISOString().split('T')[0];
        endDate = new Date().toISOString().split('T')[0]; // Today
        quarterName = `Q${currentQuarter + 1} ${now.getFullYear()}`;
      } else {
        // Parse custom quarter in format YYYY-Q#
        const [year, qNum] = quarter.split('-');
        const quarterNum = parseInt(qNum.replace('Q', ''));
        startDate = new Date(parseInt(year), (quarterNum - 1) * 3, 1).toISOString().split('T')[0];
        endDate = new Date(parseInt(year), quarterNum * 3, 0).toISOString().split('T')[0];
        quarterName = `${qNum} ${year}`;
      }
      
      // Get detailed sales data from Supabase
      const sqlQuery = `
        SELECT 
          date,
          document_number,
          description,
          item_name,
          item_type,
          amount
        FROM 
          financial_invoices
        WHERE 
          date >= '${startDate}' AND date <= '${endDate}'
        ORDER BY 
          date DESC, amount DESC
      `;
      
      // Execute the query
      const salesData = await this.executeCustomQuery(sqlQuery);
      
      // Format for Google Sheets
      const headers = ['Date', 'Invoice #', 'Description', 'Product/Service', 'Type', 'Amount'];
      const formattedData = salesData.map((item: any) => ({
        'Date': item.date,
        'Invoice #': item.document_number,
        'Description': item.description,
        'Product/Service': item.item_name,
        'Type': item.item_type,
        'Amount': item.amount
      }));
      
      // Create sheet title
      const sheetTitle = `Sales Report - ${quarterName}`;
      
      // Write to Google Sheets
      const result = await this.sheetsClient.writeFinancialData(
        sheetTitle,
        formattedData,
        headers
      );
      
      // Notify via Slack if enabled
      if (this.slackBot) {
        const message = `📊 Quarterly sales report for ${quarterName} is ready! View it here: ${result.url}`;
        await this.slackBot.processMessage(message, 'system');
      }
      
      return {
        ...result,
        period: {
          start: startDate,
          end: endDate,
          name: quarterName
        }
      };
    } catch (error) {
      console.error('Error generating quarterly sales report:', error);
      throw error;
    }
  }
  
  /**
   * Generate a yearly financial summary
   */
  async generateAnnualSummary(year: string): Promise<any> {
    try {
      // Parse year
      const targetYear = year === 'current' ? new Date().getFullYear() : parseInt(year);
      console.log(`Generating annual summary for ${targetYear}`);
      
      // Define date range for the year
      const startDate = `${targetYear}-01-01`;
      const endDate = year === 'current' 
        ? new Date().toISOString().split('T')[0] // Today if current year
        : `${targetYear}-12-31`; // End of year otherwise
      
      // Get summary data: revenue by quarter and type
      const sqlQuery = `
        SELECT 
          extract(quarter from date) as quarter,
          item_type,
          SUM(amount) as revenue
        FROM 
          financial_invoices
        WHERE 
          date >= '${startDate}' AND date <= '${endDate}'
        GROUP BY 
          quarter, item_type
        ORDER BY 
          quarter, revenue DESC
      `;
      
      // Execute the query
      const summaryData = await this.executeCustomQuery(sqlQuery);
      
      // Process the data to create a summary by quarter and type
      const quarterlyBreakdown: Record<string, { total: number, byType: Record<string, number> }> = {};
      let totalRevenue = 0;
      
      summaryData.forEach((item: any) => {
        const quarter = `Q${item.quarter}`;
        
        // Initialize quarter if needed
        if (!quarterlyBreakdown[quarter]) {
          quarterlyBreakdown[quarter] = {
            total: 0,
            byType: {}
          };
        }
        
        // Add revenue to quarter
        quarterlyBreakdown[quarter].total += parseFloat(item.revenue);
        quarterlyBreakdown[quarter].byType[item.item_type] = parseFloat(item.revenue);
        
        // Add to total
        totalRevenue += parseFloat(item.revenue);
      });
      
      // Get all unique product types
      const productTypes = Array.from(
        new Set(summaryData.map((item: any) => item.item_type))
      ) as string[];
      
      // Format for Google Sheets - create a table with quarters as columns
      const headers = ['Category', 'Q1', 'Q2', 'Q3', 'Q4', 'Total'];
      const rows: Record<string, any>[] = [];
      
      // Add a row for each product type
      for (const type of productTypes) {
        const row: Record<string, any> = {
          'Category': type,
          'Total': 0
        };
        
        // Add quarterly data
        for (let q = 1; q <= 4; q++) {
          const quarter = `Q${q}`;
          row[quarter] = quarterlyBreakdown[quarter]?.byType[type] || 0;
          row['Total'] += row[quarter];
        }
        
        rows.push(row);
      }
      
      // Add a total row
      const totalRow: Record<string, any> = {
        'Category': 'TOTAL',
        'Total': totalRevenue
      };
      
      for (let q = 1; q <= 4; q++) {
        const quarter = `Q${q}`;
        totalRow[quarter] = quarterlyBreakdown[quarter]?.total || 0;
      }
      
      rows.push(totalRow);
      
      // Create sheet title
      const sheetTitle = `Annual Summary - ${targetYear}`;
      
      // Write to Google Sheets
      const result = await this.sheetsClient.writeFinancialData(
        sheetTitle,
        rows,
        headers
      );
      
      // Notify via Slack if enabled
      if (this.slackBot) {
        const message = `📊 Annual financial summary for ${targetYear} is ready! View it here: ${result.url}`;
        await this.slackBot.processMessage(message, 'system');
      }
      
      return {
        ...result,
        period: {
          start: startDate,
          end: endDate,
          name: `Year ${targetYear}`
        },
        totalRevenue
      };
    } catch (error) {
      console.error('Error generating annual summary:', error);
      throw error;
    }
  }
  
  /**
   * Helper method to execute custom SQL queries
   * This wraps the Supabase executeNLQuery method to avoid direct access to private properties
   */
  private async executeCustomQuery(sqlQuery: string): Promise<any[]> {
    try {
      // We'll use the executeNLQuery method and intercept the SQL conversion
      // by providing a query that exactly matches our SQL pattern
      const nlQuery = `EXECUTE SQL: ${sqlQuery}`;
      const result = await this.supabaseClient.executeNLQuery(nlQuery);
      
      if (!result || (Array.isArray(result) && result.length === 0)) {
        return [];
      }
      
      return Array.isArray(result) ? result : [result];
    } catch (error) {
      console.error('Error executing custom query:', error);
      throw error;
    }
  }
} 