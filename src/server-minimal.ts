import * as dotenv from 'dotenv';
import express from 'express';
import { WebClient } from '@slack/web-api';

// Load environment variables
dotenv.config();

// Initialize the Slack Web API client
const slack = new WebClient(process.env.SLACK_BOT_TOKEN);

const app = express();
const port = process.env.PORT || 3000;

// Add middleware to parse JSON
app.use(express.json());

// Slack Events API endpoint
app.post('/slack/events', async (req, res) => {
  console.log('Received request:', req.body?.type);
  
  // Handle URL verification (required by Slack)
  if (req.body?.type === 'url_verification') {
    return res.json({ challenge: req.body.challenge });
  }
  
  // Acknowledge receipt immediately
  res.status(200).send('OK');
  
  // Process app_mention events
  try {
    if (req.body?.event?.type === 'app_mention') {
      const event = req.body.event;
      const channel = event.channel;
      
      // Respond with financial data
      await slack.chat.postMessage({
        channel: channel,
        text: "The hot tub revenue last month was $14,148.31"
      });
    }
  } catch (err) {
    console.error('Error:', err);
  }
});

// Health check endpoint
app.get('/health', (req, res) => {
  res.status(200).send('OK');
});

// Start the server
app.listen(port, () => {
  console.log(`Server running on port ${port}`);
}); 