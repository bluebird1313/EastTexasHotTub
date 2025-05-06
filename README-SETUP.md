# East Texas Hot Tub Integration Setup Guide

This guide will walk you through setting up the QuickBooks → Supabase → Slack integration.

## Prerequisites

- QuickBooks Online developer account
- Supabase account with a project
- Slack workspace with admin privileges
- OpenAI API key

## Step 1: Environment Setup

1. Create a `.env` file in the project root with the following contents:

```
# QuickBooks Configuration
QBO_CLIENT_ID=your_quickbooks_client_id
QBO_CLIENT_SECRET=your_quickbooks_client_secret
QBO_REDIRECT=http://localhost:8787/callback
QBO_ENVIRONMENT=sandbox
REALMID=your_quickbooks_realm_id

# Supabase Configuration
SUPABASE_URL=your_supabase_url
SUPABASE_SERVICE_ROLE=your_supabase_service_key

# OpenAI Configuration
OPENAI_API_KEY=your_openai_api_key

# Slack Configuration
SLACK_BOT_TOKEN=your_slack_bot_token
SLACK_SIGNING_SECRET=your_slack_signing_secret
SLACK_APP_TOKEN=your_slack_app_token
```

2. Install all required dependencies:

```bash
npm install
```

## Step 2: Initialize Supabase Schema

1. Make sure your Supabase project has the correct schema by running the migration:

```bash
cd supabase
supabase db push
```

2. This will create the `financial_invoices` table needed to store QuickBooks data.

## Step 3: Data Synchronization

1. Run the following command to sync QuickBooks data to Supabase:

```bash
npm run sync
```

2. This command should be scheduled to run regularly to keep your data up to date.

## Step 4: Slack App Configuration

1. Create a new Slack app at https://api.slack.com/apps
2. Enable the following:
   - Bot Token Scopes: `app_mentions:read`, `chat:write`, `commands`
   - Slash Commands: Create `/finance` command
   - Event Subscriptions: Subscribe to `app_mention` and `message.im` events
3. Install the app to your workspace
4. Copy the Bot Token and Signing Secret to your `.env` file

## Step 5: Deploy Slack Webhook

1. Deploy the Slack webhook function to Supabase:

```bash
supabase functions deploy slack-webhook
```

2. Copy the URL of the deployed function
3. Update your Slack app with this URL for:
   - Event Subscriptions
   - Slash Command Request URL

## Step 6: Testing

1. Test a query through the command line:

```bash
npm run query -- "What was our revenue last month?"
```

2. Test Slack integration by messaging your bot:

```
@your-bot-name What was our revenue last month?
```

3. Test the slash command:

```
/finance show me products with margin over 20%
```

## Troubleshooting

- If QuickBooks data isn't syncing, check your QB API credentials and quota
- If Slack is not responding, verify webhook URL and token permissions
- For Supabase issues, check the console logs in your Supabase project dashboard
- OpenAI errors typically relate to API key validity or quota limits

## Next Steps

- Set up scheduled jobs for regular data sync
- Extend the schema to include more financial metrics
- Add custom report templates for specific financial analysis 