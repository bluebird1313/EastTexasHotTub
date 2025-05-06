# Deployment Guide for East Texas Hot Tub Financial Bot

This guide explains how to deploy the East Texas Hot Tub Financial Bot to Render.com.

## Prerequisites

- GitHub account
- Render.com account
- Slack app with API credentials
- Supabase project

## Deployment Steps

### 1. Push to GitHub

The deployment branch is ready to be pushed to GitHub:

```bash
git push -u origin feature/slack-deployment
```

### 2. Connect to Render

1. Sign up or log in to [Render.com](https://render.com)
2. Click "New +" and select "Web Service"
3. Connect your GitHub repository
4. Select the `feature/slack-deployment` branch

### 3. Configure the Web Service

- **Name**: etht-slack-bot (or your preferred name)
- **Environment**: Node
- **Region**: Choose one closest to your users (Ohio recommended for US)
- **Branch**: feature/slack-deployment
- **Build Command**: `npm install && npm run build`
- **Start Command**: `npm start`
- **Plan**: Free

### 4. Set Environment Variables

Add the following environment variables:

- `SLACK_BOT_TOKEN`: Your Slack bot token
- `SLACK_SIGNING_SECRET`: Your Slack signing secret
- `SUPABASE_URL`: Your Supabase project URL
- `SUPABASE_SERVICE_ROLE`: Your Supabase service role key
- `NODE_ENV`: production

### 5. Deploy

Click "Create Web Service" to deploy your application.

### 6. Update Slack App

Once deployed, update your Slack app's Event Subscriptions URL to:
```
https://your-render-app-name.onrender.com/slack/events
```

## Troubleshooting

- **Deployment Fails**: Check the build logs in Render
- **Slack Bot Not Responding**: Verify environment variables and permissions
- **Database Connection Issues**: Check Supabase credentials

## Demo Mode

The application will run in demo mode if QuickBooks credentials are not provided, using generated sample data.

## Maintenance

To update the deployed application:

1. Make changes to your code
2. Commit and push to the deployment branch
3. Render will automatically redeploy 