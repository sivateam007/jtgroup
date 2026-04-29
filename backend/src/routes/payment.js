const express = require('express');
const Razorpay = require('razorpay');
const db = require('../db/database');

const router = express.Router();

// Lazy initialization of Razorpay
let razorpay = null;
function getRazorpay() {
  if (!razorpay) {
    razorpay = new Razorpay({
      key_id: process.env.RAZORPAY_KEY_ID,
      key_secret: process.env.RAZORPAY_KEY_SECRET
    });
  }
  return razorpay;
}

// Create order
router.post('/create-order', (req, res) => {
  const { userId } = req.body;
  const rzp = getRazorpay();
  
  if (!process.env.RAZORPAY_KEY_ID || process.env.RAZORPAY_KEY_ID.startsWith('rzp_test_your')) {
    return res.status(500).json({ error: 'Razorpay not configured. Please update backend/.env with valid keys.' });
  }
  
  const options = {
    amount: process.env.PLAN_PRICE_INR * 100, // ₹29 to paise
    currency: 'INR',
    receipt: `receipt_${Date.now()}`
  };
  
  rzp.orders.create(options, (err, order) => {
    if (err) {
      return res.status(500).json({ error: 'Failed to create order' });
    }
    res.json(order);
  });
});

// Verify payment
router.post('/verify', (req, res) => {
  const { userId, orderId, paymentId } = req.body;

  try {
    // Check if user has an active subscription (using SQLite date format)
    const existingSub = db.prepare("SELECT * FROM subscriptions WHERE user_id = ? AND datetime(valid_until) > datetime('now')").get(userId);

    let validUntil;
    const daysToAdd = parseInt(process.env.PLAN_VALID_DAYS || 30);

    if (existingSub) {
      // Extend existing subscription: add days to current valid_until
      // Use SQLite date function to add days to existing valid_until
      const result = db.prepare("SELECT datetime(valid_until, '+30 days') as newDate FROM subscriptions WHERE id = ?").get(existingSub.id);
      validUntil = result.newDate;
    } else {
      // New subscription: 30 days from now
      const result = db.prepare("SELECT datetime('now', '+30 days') as newDate").get();
      validUntil = result.newDate;
    }

    // Insert new subscription record (keep history)
    const stmt = db.prepare('INSERT INTO subscriptions (user_id, razorpay_order_id, razorpay_payment_id, amount, valid_until) VALUES (?, ?, ?, ?, ?)');
    stmt.run(userId, orderId, paymentId, process.env.PLAN_PRICE_INR || 29, validUntil);

    res.json({ success: true, validUntil, extended: !!existingSub });
  } catch (err) {
    res.status(500).json({ error: 'Failed to verify payment: ' + err.message });
  }
});

// Check subscription status
router.get('/status/:userId', (req, res) => {
  const { userId } = req.params;

  try {
    // Get the latest active subscription (ORDER BY valid_until DESC)
    const sub = db.prepare("SELECT * FROM subscriptions WHERE user_id = ? AND datetime(valid_until) > datetime('now') ORDER BY valid_until DESC LIMIT 1").get(userId);
    res.json({ hasAccess: !!sub, subscription: sub });
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
});

// Get Razorpay key for frontend
router.get('/config', (req, res) => {
  res.json({
    keyId: process.env.RAZORPAY_KEY_ID || ''
  });
});

module.exports = router;
