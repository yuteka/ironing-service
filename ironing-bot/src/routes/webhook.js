const express = require('express');
const router = express.Router();
const bot = require('../services/bot');
require('dotenv').config();

const VERIFY_TOKEN = process.env.WEBHOOK_VERIFY_TOKEN || 'verify_token_123';

/**
 * GET /webhook
 * Meta Cloud API verification endpoint. Meta calls this once during webhook configuration.
 */
router.get('/', (req, res) => {
  const mode = req.query['hub.mode'];
  const token = req.query['hub.verify_token'];
  const challenge = req.query['hub.challenge'];

  if (mode && token) {
    if (mode === 'subscribe' && token === VERIFY_TOKEN) {
      console.log('[Webhook Setup] Webhook verified successfully by Meta.');
      return res.status(200).send(challenge);
    } else {
      console.warn('[Webhook Setup] Webhook verification failed. Tokens mismatch.');
      return res.sendStatus(403);
    }
  }
  return res.sendStatus(400);
});

/**
 * POST /webhook
 * Meta webhook receiver endpoint. Receives customer messages, button clicks, and location updates.
 */
router.post('/', async (req, res) => {
  // Meta expects a 200 OK status code immediately to avoid webhook retry loops
  res.sendStatus(200);

  const entry = req.body?.entry?.[0];
  const change = entry?.changes?.[0];
  const value = change?.value;
  
  if (!value || !value.messages || value.messages.length === 0) {
    return; // Ignore other status changes or payloads
  }

  const message = value.messages[0];
  const from = message.from; // Customer's phone number

  try {
    if (message.type === 'text') {
      await bot.handleTextMessage(from, message);
    } else if (message.type === 'interactive') {
      const buttonReply = message.interactive?.button_reply;
      const listReply = message.interactive?.list_reply;
      const buttonId = buttonReply?.id || listReply?.id;
      if (buttonId) {
        await bot.handleButtonClick(from, buttonId);
      }
    } else if (message.type === 'location') {
      // Pass the entire location object to the text message handler (which handles geo data)
      await bot.handleTextMessage(from, message);
    }
  } catch (error) {
    console.error('[Webhook Error] Error executing bot routing logic:', error);
  }
});

module.exports = router;
