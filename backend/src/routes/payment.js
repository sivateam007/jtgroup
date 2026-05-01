const express = require('express');
const Razorpay = require('razorpay');
const crypto = require('crypto');
const db = require('../db/database');

const router = express.Router();

// Initialize Razorpay
let razorpay = null;
try {
  if (process.env.RAZORPAY_KEY_ID && process.env.RAZORPAY_KEY_SECRET) {
    // Check if keys are placeholder values
    if (process.env.RAZORPAY_KEY_ID.includes('your_key_id_here') || 
        process.env.RAZORPAY_KEY_SECRET.includes('your_key_secret_here')) {
      console.error('Razorpay not initialized: Please replace placeholder keys in .env with real test keys from https://dashboard.razorpay.com');
    } else {
      razorpay = new Razorpay({
        key_id: process.env.RAZORPAY_KEY_ID,
        key_secret: process.env.RAZORPAY_KEY_SECRET
      });
      console.log('Razorpay initialized successfully with key:', process.env.RAZORPAY_KEY_ID?.substring(0, 15) + '...');
    }
  } else {
    console.error('Razorpay not initialized: Missing RAZORPAY_KEY_ID or RAZORPAY_KEY_SECRET in .env');
  }
} catch (err) {
  console.error('Razorpay initialization failed:', err.message);
}

// Create Razorpay Order (like fullstack)
router.post('/create-order', async (req, res) => {
  const { userId } = req.body;

  if (!razorpay) {
    return res.status(500).json({ error: 'Razorpay not configured' });
  }

    try {
    const user = db.prepare('SELECT email, name FROM users WHERE id = ?').get(userId);
    if (!user) return res.status(404).json({ error: 'User not found' });

    const amountPaise = (parseInt(process.env.PLAN_PRICE_INR) || 29) * 100;

    console.log('Creating Razorpay order for user:', userId, 'amount:', amountPaise);
    console.log('Using Razorpay key:', process.env.RAZORPAY_KEY_ID?.substring(0, 10) + '...');
    
    let order;
    try {
      order = await razorpay.orders.create({
        amount: amountPaise,
        currency: 'INR',
        receipt: `receipt_${userId}_${Date.now()}`,
        notes: {
          userId: String(userId),
          plan: '30 Days Full Access'
        }
      });

      console.log('Order created successfully:', order.id);
      console.log('Order details:', JSON.stringify(order).substring(0, 200));
    } catch (razorpayErr) {
      console.error('Razorpay API error:', razorpayErr.message);
      return res.status(500).json({ error: 'Razorpay API error: ' + razorpayErr.message });
    }

    // Return keyId + order (like fullstack - public key is safe to expose)
    res.json({
      keyId: process.env.RAZORPAY_KEY_ID,
      orderId: order.id,
      amount: order.amount,
      currency: order.currency,
      planName: '30 Days Full Access',
      validityDays: 30
    });
  } catch (err) {
    console.error('Order creation failed:', err);
    res.status(500).json({ error: 'Failed to create order: ' + err.message });
  }
});

// Verify Payment (with signature check - like fullstack)
router.post('/verify', async (req, res) => {
  const { razorpay_order_id, razorpay_payment_id, razorpay_signature, userId } = req.body;

  if (!razorpay) {
    return res.status(500).json({ error: 'Razorpay not configured' });
  }

  if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature) {
    return res.status(400).json({ error: 'Missing payment details' });
  }

  // Verify signature
  const generatedSignature = crypto
    .createHmac('sha256', process.env.RAZORPAY_KEY_SECRET)
    .update(`${razorpay_order_id}|${razorpay_payment_id}`)
    .digest('hex');

  if (generatedSignature !== razorpay_signature) {
    return res.status(400).json({ error: 'Payment signature verification failed' });
  }

  try {
    // Check if subscription already exists (idempotency)
    const existingSub = db.prepare("SELECT * FROM subscriptions WHERE razorpay_order_id = ?").get(razorpay_order_id);
    if (existingSub) {
      return res.json({ success: true, validUntil: existingSub.valid_until });
    }

    // Create new subscription
    const existingActiveSub = db.prepare("SELECT * FROM subscriptions WHERE user_id = ? AND datetime(valid_until) > datetime('now')").get(userId);

    let validUntil;
    if (existingActiveSub) {
      const result = db.prepare("SELECT datetime(valid_until, '+30 days') as newDate FROM subscriptions WHERE id = ?").get(existingActiveSub.id);
      validUntil = result.newDate;
    } else {
      const result = db.prepare("SELECT datetime('now', '+30 days') as newDate").get();
      validUntil = result.newDate;
    }

    const stmt = db.prepare('INSERT INTO subscriptions (user_id, razorpay_order_id, razorpay_payment_id, amount, valid_until) VALUES (?, ?, ?, ?, ?)');
    stmt.run(userId, razorpay_order_id, razorpay_payment_id, process.env.PLAN_PRICE_INR || 29, validUntil);

    res.json({ success: true, validUntil });
  } catch (err) {
    console.error('Payment verification failed:', err);
    res.status(500).json({ error: 'Failed to verify payment: ' + err.message });
  }
});

// Check subscription status
router.get('/status/:userId', (req, res) => {
  const { userId } = req.params;

  try {
    const sub = db.prepare("SELECT * FROM subscriptions WHERE user_id = ? AND datetime(valid_until) > datetime('now') ORDER BY valid_until DESC LIMIT 1").get(userId);
    res.json({ hasAccess: !!sub, subscription: sub });
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
});

// Webhook handler (keep as backup)
router.post('/webhook', express.json(), (req, res) => {
  try {
    const webhookSecret = process.env.RAZORPAY_WEBHOOK_SECRET;

    if (process.env.NODE_ENV === 'production' && !webhookSecret) {
      console.error('Webhook: Missing webhook secret in production!');
      return res.status(401).json({ error: 'Webhook secret not configured' });
    }

    if (webhookSecret && webhookSecret !== '') {
      const razorpaySignature = req.headers['x-razorpay-signature'];

      if (!razorpaySignature) {
        console.error('Webhook: Missing signature');
        if (process.env.NODE_ENV === 'production') {
          return res.status(401).json({ error: 'Missing webhook signature' });
        }
      } else {
        const expectedSignature = crypto
          .createHmac('sha256', webhookSecret)
          .update(JSON.stringify(req.body))
          .digest('hex');

        if (expectedSignature !== razorpaySignature) {
          console.error('Webhook signature verification failed');
          return res.status(401).json({ error: 'Invalid webhook signature' });
        }
      }
    }

    const event = req.body;

    if (event.event === 'payment_link.paid' || event.event === 'order.paid') {
      const paymentEntity = event.payload?.payment?.entity;
      const orderEntity = event.payload?.order?.entity;

      if (paymentEntity && orderEntity) {
        const userId = orderEntity.notes?.userId;

        if (userId) {
          const existingSub = db.prepare("SELECT * FROM subscriptions WHERE razorpay_order_id = ?").get(orderEntity.id);
          if (!existingSub) {
            const existingActiveSub = db.prepare("SELECT * FROM subscriptions WHERE user_id = ? AND datetime(valid_until) > datetime('now')").get(userId);

            let validUntil;
            if (existingActiveSub) {
              const result = db.prepare("SELECT datetime(valid_until, '+30 days') as newDate FROM subscriptions WHERE id = ?").get(existingActiveSub.id);
              validUntil = result.newDate;
            } else {
              const result = db.prepare("SELECT datetime('now', '+30 days') as newDate").get();
              validUntil = result.newDate;
            }

            const stmt = db.prepare('INSERT INTO subscriptions (user_id, razorpay_order_id, razorpay_payment_id, amount, valid_until) VALUES (?, ?, ?, ?, ?)');
            stmt.run(userId, orderEntity.id, paymentEntity.id, process.env.PLAN_PRICE_INR || 29, validUntil);
          }
        }
      }
    }

    res.json({ received: true });
  } catch (err) {
    console.error('Webhook error:', err);
    res.status(500).json({ error: 'Webhook processing failed' });
  }
});

module.exports = router;
