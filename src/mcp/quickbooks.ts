// QuickBooks integration for MCP
import * as dotenv from 'dotenv';
import OAuthClient from 'intuit-oauth';

// Load environment variables
dotenv.config();

export class QuickBooksClient {
  private oauthClient: any;
  
  constructor() {
    const clientId = process.env.QBO_CLIENT_ID;
    const clientSecret = process.env.QBO_CLIENT_SECRET;
    const redirectUri = process.env.QBO_REDIRECT;
    const environment = 'sandbox'; // or 'production'
    
    if (!clientId || !clientSecret || !redirectUri) {
      throw new Error('QBO credentials are not properly set in the environment');
    }
    
    this.oauthClient = new OAuthClient({
      clientId,
      clientSecret,
      redirectUri,
      environment
    });
  }
  
  /**
   * Get authorization URL for OAuth flow
   */
  getAuthorizationUrl(): string {
    const authUri = this.oauthClient.authorizeUri({
      scope: [OAuthClient.scopes.Accounting],
      state: 'testState'
    });
    
    return authUri;
  }
  
  /**
   * Handle callback from OAuth flow
   */
  async handleCallback(url: string): Promise<boolean> {
    try {
      const authResponse = await this.oauthClient.createToken(url);
      const token = authResponse.getJson();
      
      return token && token.access_token ? true : false;
    } catch (error) {
      console.error('Error in OAuth callback:', error);
      return false;
    }
  }
  
  /**
   * Fetch invoices from QuickBooks
   */
  async fetchInvoices(limit = 10): Promise<any[]> {
    try {
      if (!this.oauthClient.isAccessTokenValid()) {
        throw new Error('Access token is invalid or expired');
      }
      
      const realmId = process.env.REALMID;
      if (!realmId) {
        throw new Error('REALMID is not set in the environment');
      }
      
      const url = `${this.oauthClient.environment === 'sandbox' 
        ? OAuthClient.environment.sandbox 
        : OAuthClient.environment.production}/v3/company/${realmId}/query`;
      
      const response = await this.oauthClient.makeApiCall({
        url,
        method: 'POST',
        headers: {
          'Content-Type': 'application/text'
        },
        body: `SELECT * FROM Invoice MAXRESULTS ${limit}`
      });
      
      const data = response.getJson();
      return data.QueryResponse.Invoice || [];
    } catch (error) {
      console.error('Failed to fetch invoices:', error);
      return [];
    }
  }
} 