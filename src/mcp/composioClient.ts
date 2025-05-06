// Composio client for MCP
import * as dotenv from 'dotenv';

// Load environment variables
dotenv.config();

export class ComposioClient {
  private apiKey: string;
  private endpoint: string;
  
  constructor() {
    this.apiKey = process.env.COMPOSIO_API_KEY || '';
    this.endpoint = process.env.COMPOSIO_ENDPOINT || 'https://mcp.composio.dev';
    
    if (!this.apiKey) {
      throw new Error('COMPOSIO_API_KEY is not set in the environment');
    }
  }
  
  /**
   * Initialize the Composio client connection
   */
  async initialize(): Promise<boolean> {
    try {
      console.log('Initializing Composio client with endpoint:', this.endpoint);
      const response = await this.makeRequest('/init', {
        method: 'POST'
      });
      
      return response && response.success === true;
    } catch (error) {
      console.error('Failed to initialize Composio client:', error);
      return false;
    }
  }
  
  /**
   * Make an authenticated request to the Composio API
   */
  private async makeRequest(path: string, options: RequestInit = {}): Promise<any> {
    try {
      const url = `${this.endpoint}${path}`;
      console.log('Making request to:', url);
      
      const headers = {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${this.apiKey}`,
        ...options.headers
      };
      
      const response = await fetch(url, {
        ...options,
        headers
      });
      
      if (!response.ok) {
        throw new Error(`Composio API request failed: ${response.status} ${response.statusText}`);
      }
      
      return await response.json();
    } catch (error) {
      console.error('Composio API request error:', error);
      throw error;
    }
  }
  
  /**
   * Check connection status
   */
  async checkConnection(): Promise<boolean> {
    try {
      console.log('Checking Composio connection status...');
      // Use a simpler endpoint for the initial test
      const response = await this.makeRequest('/status', {
        method: 'GET'
      });
      
      return response && response.connected === true;
    } catch (error) {
      // Log but don't throw to allow the application to continue
      console.error('Failed to check Composio connection:', error);
      return false;
    }
  }
} 