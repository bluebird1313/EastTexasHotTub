# East Texas Hot Tub

This repository contains the Management Control Panel (MCP) system for East Texas Hot Tub.

## Branch Structure

- **main**: Production-ready code
- **develop**: Integration branch for tested features
- **feature/mcp-setup**: MCP automation and connection setup

## Environment Configuration

Local development requires a `.env` file with the following configuration:

```
SUPABASE_URL=
SUPABASE_SERVICE_ROLE=
COMPOSIO_API_KEY=
COMPOSIO_ENDPOINT=
QBO_CLIENT_ID=
QBO_CLIENT_SECRET=
QBO_REDIRECT=http://localhost:8787/callback
REALMID=
STRIPE_SECRET_KEY=
STRIPE_PRICE_ID=
```

## Project Structure

```
/src/
  index.ts              # Main application entry point
  mcp/
    quickbooks.ts       # QuickBooks integration
    supabaseSync.ts     # Supabase synchronization
    composioClient.ts   # Composio API client
/supabase/
  schema.sql            # Database schema
  functions/
    qbo_sync.ts         # Edge function for QuickBooks sync
/.cursor/mcps/          # Cursor MCP configuration
wrangler.toml           # Cloudflare Workers configuration
```

## Getting Started

1. Clone the repository
2. Create a `.env` file with your configuration values
3. Install dependencies
4. Run the development server

More detailed instructions will be added as the project develops. 