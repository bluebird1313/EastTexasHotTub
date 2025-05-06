# East Texas Hot Tub

This repository contains the Management Control Panel (MCP) system for East Texas Hot Tub.

## Branch Structure

- **main**: Production-ready code
- **develop**: Integration branch for tested features
- **feature/mcp-setup**: MCP automation and connection setup
- **feature/qb-supabase-ai-integration**: QuickBooks to Supabase integration with AI-powered analysis

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
SLACK_BOT_TOKEN=
SLACK_SIGNING_SECRET=
GOOGLE_SHEETS_API_KEY=
GOOGLE_SHEETS_CLIENT_EMAIL=
GOOGLE_SHEETS_PRIVATE_KEY=
GOOGLE_SHEETS_REPORT_ID=
```

## Project Structure

```
/src/
  index.ts              # Main application entry point
  mcp/
    quickbooks.ts       # QuickBooks integration
    supabaseSync.ts     # Supabase synchronization
    composioClient.ts   # Composio API client
  integrations/
    quickbooks/         # Enhanced QuickBooks client
    supabase/           # Enhanced Supabase client
    slack/              # Slack bot integration
    google/             # Google Sheets integration
  services/
    etl/                # Data transfer services
    ai-query/           # Natural language query processing
    reporting/          # Financial reporting services
/supabase/
  schema.sql            # Database schema
  migrations/           # Database migrations
  functions/            # Edge functions
    qbo_sync.ts         # Edge function for QuickBooks sync
    slack-webhook/      # Slack webhook handler
/docs/
  README-ai-analytics.md # AI Analytics documentation
/.cursor/mcps/          # Cursor MCP configuration
wrangler.toml           # Cloudflare Workers configuration
```

## Getting Started

1. Clone the repository
2. Create a `.env` file with your configuration values
3. Install dependencies: `npm install`
4. Run the development server: `npm run dev`

## Features

### Financial Analytics via Slack

Ask questions about your business performance directly in Slack:
- "What was the revenue for hot tubs last month?"
- "Show me YTD expenses by category"

See [AI Financial Analytics Documentation](./docs/README-ai-analytics.md) for details.

### Google Sheets Integration

In addition to Slack summaries, full financial reports (like invoices or expense logs) can be exported to Google Sheets.

The system:
- Uses an MCP tool to query Supabase
- Pushes results to a connected Google Sheet
- Sends a Slack message with a link to the sheet

Required environment variables:
- `GOOGLE_SHEETS_API_KEY`: API key for Google Sheets access
- `GOOGLE_SHEETS_CLIENT_EMAIL`: Service account email
- `GOOGLE_SHEETS_PRIVATE_KEY`: Service account private key
- `GOOGLE_SHEETS_REPORT_ID`: ID of the target spreadsheet

To generate a report:
```
npm run report -- --type=monthly-revenue --month=current
```

Reports are automatically generated on the first of each month using a scheduled Supabase Edge Function.

More detailed instructions will be added as the project develops. 