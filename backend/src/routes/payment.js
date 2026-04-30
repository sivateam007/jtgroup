const express = require('express');
const https = require('https');
const db = require('../db/database');

const router = express.Router();

// Create Razorpay Payment Link (server-to-server, no frontend Key ID exposure)
router.post('/create-payment-link', async (req, res) => {
  const { userId } = req.body;

  if (!process.env.RAZORPAY_KEY_ID || !process.env.RAZORPAY_KEY_SECRET) {
    return res.status(500).json({ error: 'Razorpay not configured' });
  }

  try {
    // Get user email for Razorpay
    const user = db.prepare('SELECT email, name FROM users WHERE id = ?').get(userId);
    if (!user) return res.status(404).json({ error: 'User not found' });

    const amount = parseInt(process.env.PLAN_PRICE_INR || 29) * 100; // ₹29 to paise
    const callbackUrl = `${process.env.APP_ORIGIN || 'http://localhost:3000'}/app/dashboard.html`;
    const isTestMode = process.env.RAZORPAY_KEY_ID?.startsWith('rzp_test_');

    const paymentLinkData = {
      amount: amount,
      currency: 'INR',
      description: '30 Days Full Access - JT Group of Institution',
      customer: {
        name: user.name || 'User',
        email: user.email
      },
      notify: {
        sms: false,
        email: false
      },
      callback_url: callbackUrl,
      callback_method: 'get'
    };

    // UPI Payment Links not supported in Test Mode
    if (!isTestMode) {
      paymentLinkData.upi_link = true;
    }

    const auth = Buffer.from(`${process.env.RAZORPAY_KEY_ID}:${process.env.RAZORPAY_KEY_SECRET}`).toString('base64');

    const postData = JSON.stringify(paymentLinkData);
    const options = {
      hostname: 'api.razorpay.com',
      path: '/v1/payment_links',
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Basic ${auth}`,
        'Content-Length': Buffer.byteLength(postData)
      }
    };

    const req = https.request(options, (response) => {
      let data = '';
      response.on('data', (chunk) => { data += chunk; });
      response.on('end', () => {
        try {
          const result = JSON.parse(data);
          if (response.statusCode !== 200) {
            console.error('Razorpay Payment Link creation failed:', result);
            return res.status(500).json({ error: 'Failed to create payment link: ' + (result.error?.description || 'Unknown error') });
          }
          res.json({ paymentUrl: result.short_url });
        } catch (e) {
          res.status(500).json({ error: 'Failed to parse Razorpay response' });
        }
      });
    });

    req.on('error', (err) => {
      console.error('Razorpay request failed:', err);
      res.status(500).json({ error: 'Failed to create payment link: ' + err.message });
    });

    req.write(postData);
    req.end();
  } catch (err) {
    console.error('Payment link error:', err);
    res.status(500).json({ error: 'Failed to create payment link: ' + err.message });
  }
});

// Webhook handler for Razorpay Payment Link events
router.post('/webhook', express.json(), (req, res) => {
  try {
    // Security: Verify webhook signature if secret is configured
    const webhookSecret = process.env.RAZORPAY_WEBHOOK_SECRET;
    if (webhookSecret) {
      const crypto = require('crypto');
      const razorpaySignature = req.headers['x-razorpay-signature'];
      
      if (!razorpaySignature) {
        return res.status(401).json({ error: 'Missing webhook signature' });
      }
      
      const expectedSignature = crypto
        .createHmac('sha256', webhookSecret)
        .update(JSON.stringify(req.body))
        .digest('hex');
      
      if (expectedSignature !== razorpaySignature) {
        console.error('Webhook signature verification failed');
        return res.status(401).json({ error: 'Invalid webhook signature' });
      }
    }
    
    const event = req.body;

    // Handle payment_link.paid event
    if (event.event === 'payment_link.paid') {
      const paymentEntity = event.payload?.payment?.entity;
      const paymentLinkEntity = event.payload?.payment_link?.entity;

      if (paymentEntity && paymentLinkEntity) {
        // Extract user info from payment link description or customer details
        // Note: You may need to store userId in the payment link description or use a custom field
        const customerEmail = paymentEntity.email || paymentLinkEntity.customer?.email;

        if (customerEmail) {
          const user = db.prepare('SELECT id FROM users WHERE email = ?').get(customerEmail);
          if (user) {
            const userId = user.id;
            const paymentId = paymentEntity.id;
            const orderId = paymentLinkEntity.id;

            // Check if user has an active subscription
            const existingSub = db.prepare("SELECT * FROM subscriptions WHERE user_id = ? AND datetime(valid_until) > datetime('now')").get(userId);

            let validUntil;
            if (existingSub) {
              const result = db.prepare("SELECT datetime(valid_until, '+30 days') as newDate FROM subscriptions WHERE id = ?").get(existingSub.id);
              validUntil = result.newDate;
            } else {
              const result = db.prepare("SELECT datetime('now', '+30 days') as newDate").get();
              validUntil = result.newDate;
            }

            // Insert subscription record
            const stmt = db.prepare('INSERT INTO subscriptions (user_id, razorpay_order_id, razorpay_payment_id, amount, valid_until) VALUES (?, ?, ?, ?, ?)');
            stmt.run(userId, orderId, paymentId, process.env.PLAN_PRICE_INR || 29, validUntil);
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

module.exports = router;
