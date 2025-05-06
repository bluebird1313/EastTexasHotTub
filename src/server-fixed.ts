import * as dotenv from 'dotenv';
import express from 'express';
import * as fs from 'fs';
import { WebClient } from '@slack/web-api';
import axios from 'axios';

// Load environment variables
dotenv.config();
console.log('Environment variables loaded');
console.log('SLACK_SIGNING_SECRET exists:', !!process.env.SLACK_SIGNING_SECRET);
console.log('SLACK_BOT_TOKEN exists:', !!process.env.SLACK_BOT_TOKEN);

// Initialize the Slack Web API client
const slack = new WebClient(process.env.SLACK_BOT_TOKEN);

const app = express();
const port = process.env.PORT || 3000;

// Add middleware to parse JSON
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Simple verification endpoint
app.post('/slack/events', async (req, res) => {
  console.log('Received slack request');
  
  // If this is a URL verification request from Slack
  if (req.body && req.body.type === 'url_verification') {
    console.log('URL verification:', req.body.challenge);
    return res.json({ challenge: req.body.challenge });
  }
  
  // Respond to Slack immediately
  res.status(200).send('OK');
  
  // Process events asynchronously
  if (req.body && req.body.event) {
    const event = req.body.event;
    console.log('Event type:', event.type);
    
    if (event.type === 'app_mention') {
      const text = event.text;
      const channel = event.channel;
      const user = event.user;
      
      console.log(`Mention from ${user} in channel ${channel}: ${text}`);
      
      try {
        // Send response back to Slack
        const response = "The total hot tub revenue last month was $14,148.31";
        console.log(`Sending response to channel ${channel}`);
        
        await slack.chat.postMessage({
          channel: channel,
          text: response
        });
        
      } catch (error) {
        console.error('Error processing mention:', error);
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

// Start the server
app.listen(port, () => {
  console.log(`Server is running on port ${port}`);
  console.log(`Slack events will be received at /slack/events`);
}); 