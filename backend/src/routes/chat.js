const express = require('express');
const { GoogleGenerativeAI } = require('@google/generative-ai');
const router = express.Router();

const SYSTEM_PROMPT = `You are JT Guide, an AI assistant for JT Group of Institution's online learning platform. Your job is to help users navigate the website and answer questions about courses, pricing, and how to use the platform.

SITE STRUCTURE:
- Landing page: /
- Login page: /app/login.html
- Signup page: /app/signup.html
- Dashboard: /app/dashboard.html (after login)
- Payment/plans: /app/payment.html (after login)
- All courses (Tamil language): /courses/tamil/

COURSE CATEGORIES (all in Tamil):
- Front End: /courses/tamil/FRONT_END_DEVELOPMENT/
- Full Stack: /courses/tamil/full%20stack%20development/
- Programming Languages: /courses/tamil/programming-languages/
- Web Development: /courses/tamil/WEB_DEVELOPMENT/
- Backend Development: /courses/tamil/backend%20development/
- Database: /courses/tamil/database/

PRICING:
- Plan price: ₹999 per year (365 days access)
- Certificate price: ₹499

RULES:
1. Always provide clickable HTML links in your answers using <a href="...">text</a>
2. Be friendly and helpful, answer in English or simple language
3. If a user asks about a specific course topic, guide them to the relevant category page
4. Suggest signup for new users, login for existing users
5. Keep answers concise and helpful`;

router.post('/', async (req, res) => {
  try {
    const { message } = req.body;
    if (!message) {
      return res.status(400).json({ error: 'Message is required' });
    }

    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      return res.status(500).json({ error: 'GEMINI_API_KEY not configured' });
    }

    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({
      model: 'gemini-3.1-flash-lite-preview',
      systemInstruction: SYSTEM_PROMPT,
    });

    const result = await model.generateContent(message);
    const reply = result.response.text();

    res.json({ reply });
  } catch (error) {
    console.error('Chat error:', error.message);
    res.status(500).json({ error: 'Failed to get response. Please try again.' });
  }
});

module.exports = router;
