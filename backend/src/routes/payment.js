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
    // We'll append paymentLinkId after Razorpay creates it
    // For now, use a callback that login.html can handle
    const baseCallbackUrl = `${process.env.APP_ORIGIN || 'http://localhost:3000'}/app/login.html`;
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
      callback_url: baseCallbackUrl + '?payment=success',
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
          // Return payment URL with paymentLinkId appended for verification
          const finalCallbackUrl = `${baseCallbackUrl}?payment=success&plink=${result.id}`;
          res.json({ 
            paymentUrl: result.short_url, 
            paymentLinkId: result.id,
            callbackUrl: finalCallbackUrl 
          });
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
    
    // In production, webhook secret MUST be configured
    if (process.env.NODE_ENV === 'production' && !webhookSecret) {
      console.error('Webhook: Missing webhook secret in production!');
      return res.status(401).json({ error: 'Webhook secret not configured' });
    }
    
    // Verify signature if webhook secret is configured
    if (webhookSecret && webhookSecret !== '') {
      const crypto = require('crypto');
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

// Manual payment verification (verifies with Razorpay API)
router.post('/verify-manual', (req, res) => {
  const { userId, paymentLinkId } = req.body;
  
  // Validate input
  if (!userId || !paymentLinkId) {
    return res.status(400).json({ error: 'Missing userId or paymentLinkId' });
  }
  
  // Verify payment link with Razorpay API
  const auth = Buffer.from(process.env.RAZORPAY_KEY_ID + ':' + process.env.RAZORPAY_KEY_SECRET).toString('base64');
  
  const options = {
    hostname: 'api.razorpay.com',
    port: 443,
    path: `/v1/payment_links/${paymentLinkId}`,
    method: 'GET',
    headers: { 'Authorization': 'Basic ' + auth }
  };
  
  const verifyReq = https.request(options, (verifyRes) => {
    let data = '';
    verifyRes.on('data', (chunk) => { data += chunk; });
    verifyRes.on('end', () => {
      try {
        const linkDetails = JSON.parse(data);
        
        // Log for debugging
        console.log('Razorpay link details:', JSON.stringify(linkDetails));
        
        // Check if payment was actually made
        if (linkDetails.status === 'paid') {
          // Razorpay returns payments as array of objects or IDs
          let paymentId = 'manual_' + Date.now();
          if (linkDetails.payments && linkDetails.payments.length > 0) {
            const firstPayment = linkDetails.payments[0];
            paymentId = typeof firstPayment === 'string' ? firstPayment : (firstPayment.id || firstPayment.entity?.id || paymentId);
          }
          
          // Check if subscription already exists (idempotency)
          const existingSub = db.prepare("SELECT * FROM subscriptions WHERE razorpay_order_id = ?").get(paymentLinkId);
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
          stmt.run(userId, paymentLinkId, paymentId, process.env.PLAN_PRICE_INR || 29, validUntil);
          
          res.json({ success: true, validUntil });
        } else {
          console.error('Payment not paid. Status:', linkDetails.status, 'Response:', data);
          res.status(400).json({ error: 'Payment not verified with Razorpay. Status: ' + (linkDetails.status || 'unknown') });
        }
      } catch (err) {
        console.error('Parse error:', err, 'Data:', data);
        res.status(500).json({ error: 'Failed to parse Razorpay response: ' + err.message });
      }
    });
  });
  
  verifyReq.on('error', (err) => {
    console.error('Razorpay API error:', err);
    res.status(500).json({ error: 'Failed to verify with Razorpay: ' + err.message });
  });
  
  verifyReq.end();
});

module.exports = router;
