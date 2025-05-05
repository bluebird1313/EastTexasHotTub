import { ComposioClient } from './mcp/composioClient';
import { SupabaseSync } from './mcp/supabaseSync';
import { QuickBooksClient } from './mcp/quickbooks';

console.log("East Texas Hot Tub MCP system initialized");

async function initializeConnections() {
  try {
    // Initialize Composio client
    const composioClient = new ComposioClient();
    const composioConnected = await composioClient.checkConnection();
    console.log(`Composio connection: ${composioConnected ? 'Connected' : 'Failed'}`);
    
    // Initialize Supabase
    try {
      const supabaseSync = new SupabaseSync();
      const supabaseConnected = await supabaseSync.testConnection();
      console.log(`Supabase connection: ${supabaseConnected ? 'Connected' : 'Failed'}`);
    } catch (error) {
      console.log('Supabase connection: Not configured properly');
    }
    
    // Initialize QuickBooks (just create the client, actual connection requires OAuth flow)
    try {
      const qboClient = new QuickBooksClient();
      const authUrl = qboClient.getAuthorizationUrl();
      console.log('QuickBooks OAuth URL:', authUrl);
      console.log('Please visit this URL to authorize the application with QuickBooks');
    } catch (error) {
      console.log('QuickBooks connection: Not configured properly');
    }
    
  } catch (error) {
    console.error('Error initializing connections:', error);
  }
}

// Run initialization
initializeConnections().catch(error => {
  console.error('Unhandled error during initialization:', error);
}); 