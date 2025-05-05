// Composio client for MCP
import * as dotenv from 'dotenv';

// Load environment variables
dotenv.config();

export class ComposioClient {
  private apiKey: string;
  private endpoint: string;
  
  constructor() {
    this.apiKey = process.env.COMPOSIO_API_KEY || '';
    this.endpoint = process.env.COMPOSIO_ENDPOINT || 'https://api.composio.dev';
    
    if (!this.apiKey) {
      throw new Error('COMPOSIO_API_KEY is not set in the environment');
    }
  }
  
  /**
   * Initialize the Composio client connection
   */
  async initialize(): Promise<boolean> {
    try {
      const response = await this.makeRequest('/init', {
        method: 'POST'
      });
      
      return response.success === true;
    } catch (error) {
      console.error('Failed to initialize Composio client:', error);
      return false;
    }
  }
  
  /**
   * Make an authenticated request to the Composio API
   */
  private async makeRequest(path: string, options: RequestInit = {}): Promise<any> {
    const url = `${this.endpoint}${path}`;
    
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
  }
  
  /**
   * Check connection status
   */
  async checkConnection(): Promise<boolean> {
    try {
      const response = await this.makeRequest('/status', {
        method: 'GET'
      });
      
      return response.connected === true;
    } catch (error) {
      console.error('Failed to check Composio connection:', error);
      return false;
    }
  }
} 