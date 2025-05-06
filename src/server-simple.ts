import * as dotenv from 'dotenv';
import express from 'express';
import * as fs from 'fs';
import { WebClient } from '@slack/web-api';
import axios from 'axios';

// Load environment variables
dotenv.config();
console.log('Environment variables loaded from dotenv');
console.log('SLACK_SIGNING_SECRET exists:', !!process.env.SLACK_SIGNING_SECRET);
console.log('SLACK_BOT_TOKEN exists:', !!process.env.SLACK_BOT_TOKEN);
console.log('SLACK_BOT_TOKEN:', process.env.SLACK_BOT_TOKEN?.substring(0, 10) + '...');

// Fallback to reading .env file directly if environment variables aren't set
if (!process.env.SLACK_SIGNING_SECRET || !process.env.SLACK_BOT_TOKEN) {
  console.log('Trying to read .env file directly');
  try {
    const envContent = fs.readFileSync('.env', 'utf8');
    const envLines = envContent.split('\n');
    
    for (const line of envLines) {
      const match = line.match(/^([^=]+)=(.*)$/);
      if (match) {
        const key = match[1].trim();
        const value = match[2].trim();
        if (key && value && !process.env[key]) {
          process.env[key] = value;
          console.log(`Manually set ${key} from .env file`);
        }
      }
    }
  } catch (error) {
    console.error('Error reading .env file:', error);
  }
}

// Initialize the Slack Web API client
const slack = new WebClient(process.env.SLACK_BOT_TOKEN);

const app = express();
const port = process.env.PORT || 3000;

// Add middleware to parse JSON
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Log all requests
app.use((req, res, next) => {
  console.log(`${new Date().toISOString()} ${req.method} ${req.url}`);
  next();
});

// Simple verification endpoint
app.post('/slack/events', async (req, res) => {
  console.log('=== RECEIVED SLACK REQUEST ===');
  console.log('Headers:', JSON.stringify(req.headers));
  console.log('Body:', JSON.stringify(req.body));
  
  // If this is a URL verification request from Slack
  if (req.body && req.body.type === 'url_verification') {
    console.log('URL VERIFICATION: Responding with challenge:', req.body.challenge);
    return res.json({ challenge: req.body.challenge });
  }
  
  // Respond to Slack immediately (important!)
  res.status(200).send('OK');
  
  // Process events asynchronously
  if (req.body && req.body.event) {
    const event = req.body.event;
    console.log('Event type:', event.type);
    
    if (event.type === 'app_mention') {
      const text = event.text;
      const channel = event.channel;
      const user = event.user;
      
      console.log(`MENTION: from ${user} in channel ${channel}: ${text}`);
      
      try {
        // Direct attempt to post back to the channel
        const response = "The total hot tub revenue last month was $14,148.31";
        console.log(`SENDING MESSAGE to channel ${channel}: ${response}`);
        
        // Test the token by making a simple API call
        try {
          console.log('Testing Slack API with auth.test...');
          const authTest = await slack.auth.test();
          console.log('Auth test result:', JSON.stringify(authTest));
        } catch (authError) {
          console.error('Auth test failed:', authError);
        }
        
        // Try both methods to send a message
        
        // Method 1: Using the WebClient
        try {
          const result = await slack.chat.postMessage({
            channel: channel,
            text: response
          });
          console.log('WebClient response:', JSON.stringify(result));
        } catch (slackError) {
          console.error('WebClient error:', slackError);
        }
        
        // Method 2: Using axios directly
        try {
          console.log('Trying direct API call with axios...');
          const apiResponse = await axios.post(
            'https://slack.com/api/chat.postMessage',
            {
              channel: channel,
              text: `[Direct API] ${response}`
            },
            {
              headers: {
                'Authorization': `Bearer ${process.env.SLACK_BOT_TOKEN}`,
                'Content-Type': 'application/json'
              }
            }
          );
          console.log('Direct API response:', JSON.stringify(apiResponse.data));
        } catch (axiosError) {
          console.error('Axios error:', axiosError);
        }
        
      } catch (error) {
        console.error('ERROR PROCESSING MENTION:', error);
      }
    }
  }
});

// Health check endpoint
app.get('/health', (req, res) => {
  res.status(200).send({
    status: 'OK',
    env: {
      SLACK_SIGNING_SECRET_EXISTS: !!process.env.SLACK_SIGNING_SECRET,
      SLACK_BOT_TOKEN_EXISTS: !!process.env.SLACK_BOT_TOKEN
    }
  });
});

// Test endpoint to verify Slack token
app.get('/test-slack', async (req, res) => {
  try {
    const result = await slack.auth.test();
    res.json({
      success: true,
      result: result
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// Handle errors
app.use((err: any, req: any, res: any, next: any) => {
  console.error('Server error:', err);
  res.status(500).send('Server error');
});

// Start the server
app.listen(port, () => {
  console.log(`Simple server is running on port ${port}`);
  console.log(`Slack events will be received at http://your-server-url:${port}/slack/events`);
  console.log('Environment check:');
  console.log('- SLACK_SIGNING_SECRET exists:', !!process.env.SLACK_SIGNING_SECRET);
  console.log('- SLACK_BOT_TOKEN exists:', !!process.env.SLACK_BOT_TOKEN);
}); 