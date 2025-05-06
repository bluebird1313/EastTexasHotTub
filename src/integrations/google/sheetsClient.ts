import * as dotenv from 'dotenv';
import { GoogleSpreadsheet } from 'google-spreadsheet';
import { JWT } from 'google-auth-library';

// Load environment variables
dotenv.config();

/**
 * Client for interacting with Google Sheets
 */
export class GoogleSheetsClient {
  private serviceAccountAuth: JWT;
  private spreadsheetId: string;
  
  constructor() {
    // Get configuration from environment variables
    const clientEmail = process.env.GOOGLE_SHEETS_CLIENT_EMAIL;
    const privateKey = process.env.GOOGLE_SHEETS_PRIVATE_KEY?.replace(/\\n/g, '\n');
    const spreadsheetId = process.env.GOOGLE_SHEETS_REPORT_ID;
    
    if (!clientEmail || !privateKey || !spreadsheetId) {
      throw new Error('Google Sheets credentials are not properly set in the environment');
    }
    
    // Create JWT auth client
    this.serviceAccountAuth = new JWT({
      email: clientEmail,
      key: privateKey,
      scopes: [
        'https://www.googleapis.com/auth/spreadsheets',
      ],
    });
    
    this.spreadsheetId = spreadsheetId;
  }
  
  /**
   * Get or create a spreadsheet for financial reporting
   */
  async getSpreadsheet() {
    try {
      // Load the spreadsheet
      const doc = new GoogleSpreadsheet(this.spreadsheetId, this.serviceAccountAuth);
      await doc.loadInfo();
      
      return doc;
    } catch (error) {
      console.error('Failed to load spreadsheet:', error);
      throw error;
    }
  }
  
  /**
   * Create a new sheet within the spreadsheet
   */
  async createSheet(title: string) {
    try {
      const doc = await this.getSpreadsheet();
      
      // Add a new sheet
      const sheet = await doc.addSheet({ title });
      
      return sheet;
    } catch (error) {
      console.error(`Failed to create sheet "${title}":`, error);
      throw error;
    }
  }
  
  /**
   * Get an existing sheet by title, or create if it doesn't exist
   */
  async getOrCreateSheet(title: string) {
    try {
      const doc = await this.getSpreadsheet();
      
      // Try to find existing sheet
      let sheet = doc.sheetsByTitle[title];
      
      // Create if it doesn't exist
      if (!sheet) {
        sheet = await doc.addSheet({ title });
      }
      
      return sheet;
    } catch (error) {
      console.error(`Failed to get or create sheet "${title}":`, error);
      throw error;
    }
  }
  
  /**
   * Write financial data to a sheet
   */
  async writeFinancialData(sheetTitle: string, data: any[], headers: string[]) {
    try {
      // Get or create the sheet
      const sheet = await this.getOrCreateSheet(sheetTitle);
      
      // Clear existing data
      await sheet.clear();
      
      // Set the headers
      await sheet.setHeaderRow(headers);
      
      // Add the rows
      await sheet.addRows(data);
      
      console.log(`Added ${data.length} rows to sheet "${sheetTitle}"`);
      
      return {
        sheetTitle,
        spreadsheetId: this.spreadsheetId,
        rowCount: data.length,
        url: `https://docs.google.com/spreadsheets/d/${this.spreadsheetId}/edit#gid=${sheet.sheetId}`
      };
    } catch (error) {
      console.error(`Failed to write data to sheet "${sheetTitle}":`, error);
      throw error;
    }
  }
} 