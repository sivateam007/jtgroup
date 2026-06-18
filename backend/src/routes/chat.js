const express = require('express');
const { getReply } = require('../chatbot/matcher');
const router = express.Router();

router.post('/', (req, res) => {
  try {
    const { message, language } = req.body;
    if (!message) {
      return res.status(400).json({ error: 'Message is required' });
    }

    const result = getReply(message, language || 'en');
    res.json(result);
  } catch (error) {
    console.error('Chat error:', error.message);
    res.status(500).json({ error: 'Failed to get response. Please try again.' });
  }
});

module.exports = router;
