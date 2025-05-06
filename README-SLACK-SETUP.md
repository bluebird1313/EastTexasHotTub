# Slack Bot Setup Instructions

This guide will walk you through setting up your Slack bot for the East Texas Hot Tub financial analytics system.

## Prerequisites

- A Slack workspace where you have admin permissions
- Your East Texas Hot Tub application running locally or on a server
- The server must be accessible via a public URL (we'll explain how to do this)

## Step 1: Create a Slack App

1. Go to [api.slack.com/apps](https://api.slack.com/apps)
2. Click "Create New App"
3. Choose "From scratch"
4. Name your app (e.g., "ETHT Financial Bot") and select your workspace
5. Click "Create App"

## Step 2: Configure Bot Permissions

1. In the left sidebar, click on "OAuth & Permissions"
2. Scroll down to "Scopes" and add the following Bot Token Scopes:
   - `app_mentions:read` (to read when the bot is mentioned)
   - `chat:write` (to post messages)
   - `channels:history` (to read channel messages)
3. Scroll up and click "Install to Workspace"
4. Authorize the app when prompted

## Step 3: Get the App Credentials

1. Note your "Bot User OAuth Token" (starts with `xoxb-`) - This is your `SLACK_BOT_TOKEN`
2. Go to "Basic Information" in the left sidebar
3. Find "App Credentials" section
4. Copy the "Signing Secret" - This is your `SLACK_SIGNING_SECRET`

## Step 4: Make Your Server Publicly Accessible

### Option 1: Use ngrok (for development)

1. Install ngrok: `npm install -g ngrok` (or download from [ngrok.com](https://ngrok.com/))
2. Run ngrok to expose your local server: `ngrok http 3000`
3. Note the HTTPS URL provided by ngrok (e.g., `https://a1b2c3d4.ngrok.io`)

### Option 2: Deploy to a Public Server (for production)

If you're using a hosting service, use the public URL of your server.

## Step 5: Configure Event Subscriptions

1. Go to "Event Subscriptions" in the left sidebar of your Slack App settings
2. Toggle "Enable Events" to On
3. In the "Request URL" field, enter your public URL + `/slack/events`
   - Example: `https://a1b2c3d4.ngrok.io/slack/events`
4. After Slack verifies the URL, scroll down to "Subscribe to bot events"
5. Click "Add Bot User Event" and add `app_mention`
6. Save changes

## Step 6: Update Your Environment Variables

Add these variables to your `.env` file:

```
SLACK_BOT_TOKEN=xoxb-your-token-here
SLACK_SIGNING_SECRET=your-signing-secret-here
```

## Step 7: Start Your Server

1. Start your server: `npm run server`
2. Make sure it's running and accessible via the public URL

## Step 8: Test Your Bot

1. Invite your bot to a channel in Slack: `/invite @YourBotName`
2. Mention the bot with a query: `@YourBotName What was our hot tub revenue last month?`
3. The bot should respond with financial data from your Supabase database

## Troubleshooting

- **Bot not responding**: Check your server logs for errors
- **Error messages**: Make sure your environment variables are set correctly
- **Connection issues**: Verify your ngrok URL is still active (they expire after a few hours on the free plan)
- **Permission errors**: Make sure you've added all the required scopes

## Advanced Configuration

- To customize bot responses, edit `src/integrations/slack/bot.ts`
- To add more query capabilities, enhance the `executeNLQuery` method in `src/integrations/supabase/client.ts`
- For message formatting, check Slack's [Block Kit Builder](https://api.slack.com/block-kit) 