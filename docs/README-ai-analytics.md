# AI Financial Analytics

## Overview
This component synchronizes data from QuickBooks to Supabase and provides natural language querying of financial data via a Slack bot. It enables team members to ask questions about business performance in plain English, with the system automatically translating these questions into SQL queries and returning formatted results.

## Architecture

### Components

#### Data Flow
1. **QuickBooks Integration**: Extracts financial data using the QuickBooks API
2. **ETL Service**: Transforms data and loads it into Supabase
3. **Supabase Database**: Stores structured financial data
4. **AI Query Engine**: Translates natural language to SQL
5. **Slack Bot**: Handles user interactions and presents results
6. **Google Sheets Export**: Generates detailed reports in spreadsheet format

#### Implementation Details
- Scheduled data sync using Supabase Edge Functions
- Natural language processing for financial queries
- Secure data access using Supabase Row Level Security
- Pre-built functions for common financial queries
- Automated report generation and distribution

## Setup

### Prerequisites
- QuickBooks Online account with API access
- Supabase project
- Slack workspace with permissions to add apps
- Google Cloud project with Sheets API enabled

### Configuration
1. Set up environment variables:
   ```
   SUPABASE_URL=your-supabase-url
   SUPABASE_SERVICE_ROLE=your-service-role-key
   QUICKBOOKS_API_KEY=your-qb-api-key
   QUICKBOOKS_API_SECRET=your-qb-api-secret
   SLACK_BOT_TOKEN=your-slack-bot-token
   SLACK_SIGNING_SECRET=your-slack-signing-secret
   GOOGLE_SHEETS_API_KEY=your-google-sheets-api-key
   GOOGLE_SHEETS_CLIENT_EMAIL=your-service-account-email
   GOOGLE_SHEETS_PRIVATE_KEY=your-service-account-private-key
   GOOGLE_SHEETS_REPORT_ID=your-target-spreadsheet-id
   ```

2. Deploy Supabase migrations:
   ```
   supabase db push
   ```

3. Deploy Edge Functions:
   ```
   supabase functions deploy sync-financial-data
   supabase functions deploy slack-webhook
   supabase functions deploy generate-reports
   ```

4. Configure Slack app to use the Edge Function webhook URL

5. Set up Google Sheets service account:
   - Create a service account in Google Cloud Console
   - Enable Google Sheets API
   - Generate and download credentials
   - Share target spreadsheet with service account email

## Usage Examples

### Slack Queries

Users can ask questions in a Slack channel where the bot is invited, such as:

- "What was the revenue for hot tubs last month?"
- "How much did we sell in services last quarter?"
- "Show me the top 5 products by revenue"
- "What were our total sales for 2023?"

The bot will respond with formatted answers directly in the Slack thread.

### Report Generation

To generate a detailed financial report in Google Sheets:

```
npm run report -- --type=monthly-revenue --month=current
```

Available report types:
- `monthly-revenue`: Revenue breakdown by product category
- `quarterly-sales`: Detailed sales report with trends
- `annual-summary`: Year-to-date financial summary

Reports can also be scheduled to run automatically on a recurring basis.

## Development

### Local Development
1. Clone the repository
2. Create a `.env` file with the required variables
3. Install dependencies: `npm install`
4. Run the development server: `npm run dev`

### Adding New Query Types
To add support for new types of financial queries:

1. Update the `convertNLToSQL` method in `src/integrations/supabase/client.ts`
2. Add new SQL functions in `supabase/migrations/20240530000000_financial_schema.sql`
3. Update the response formatting in `src/services/ai-query/queryService.ts`

### Adding New Report Types
To create new types of spreadsheet reports:

1. Create a report template function in `src/services/reporting/reportTemplates.ts`
2. Add the report type to the CLI options in `src/services/reporting/index.ts`
3. Configure the appropriate SQL queries in Supabase functions

## Integration with Main Project

This feature fits into the overall East Texas Hot Tub MCP by:

1. Leveraging the existing QuickBooks and Supabase MCP connections
2. Providing a user-friendly interface to financial data via Slack
3. Supporting business decision-making through accessible analytics
4. Demonstrating the practical application of the MCP infrastructure
5. Creating shareable reports for stakeholder communication

## Future Enhancements

- Interactive charts and graphs in Slack responses
- Support for more complex financial metrics (profit margins, growth rates)
- Scheduled reports sent automatically to specified channels
- Integration with other data sources beyond QuickBooks
- Custom Google Sheets templates with formatting and visualizations 