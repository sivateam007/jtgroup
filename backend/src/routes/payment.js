const express = require('express');
const Razorpay = require('razorpay');
const crypto = require('crypto');
const db = require('../db/database');

const router = express.Router();

// Initialize Razorpay
let razorpay = null;
let razorpayReady = false;

try {
  if (process.env.RAZORPAY_KEY_ID && process.env.RAZORPAY_KEY_SECRET) {
    // Check if keys are placeholder values
    if (process.env.RAZORPAY_KEY_ID.includes('your_key_id_here') || 
        process.env.RAZORPAY_KEY_SECRET.includes('your_key_secret_here')) {
      console.error('ERROR: Razorpay keys are placeholders! Get real test keys from https://dashboard.razorpay.com');
      razorpayReady = false;
    } else if (!process.env.RAZORPAY_KEY_ID.startsWith('rzp_')) {
      console.error('ERROR: RAZORPAY_KEY_ID should start with rzp_test_ or rzp_live_');
      razorpayReady = false;
    } else {
      razorpay = new Razorpay({
        key_id: process.env.RAZORPAY_KEY_ID,
        key_secret: process.env.RAZORPAY_KEY_SECRET
      });
      razorpayReady = true;
      console.log('Razorpay initialized successfully with key:', process.env.RAZORPAY_KEY_ID?.substring(0, 20) + '...');
    }
  } else {
    console.error('ERROR: Missing RAZORPAY_KEY_ID or RAZORPAY_KEY_SECRET in .env file');
    razorpayReady = false;
  }
} catch (err) {
  console.error('Razorpay initialization failed:', err.message);
  razorpayReady = false;
}

// Create Razorpay Order - Uses Payment Links (hosted pages) to avoid blank page issues
router.post('/create-order', async (req, res) => {
  const { userId } = req.body;

  if (!razorpay) {
    return res.status(500).json({ error: 'Razorpay not configured' });
  }

    try {
    const user = db.prepare('SELECT email, name FROM users WHERE id = ?').get(userId);
    if (!user) return res.status(404).json({ error: 'User not found' });

    const amountPaise = (parseInt(process.env.PLAN_PRICE_INR) || 29) * 100;

    console.log('Creating Razorpay payment link for user:', userId, 'amount:', amountPaise);

    // Create payment link (hosted page) - this avoids modal/popup issues
    const paymentLink = await razorpay.paymentLink.create({
      amount: amountPaise,
      currency: 'INR',
      accept_partial: false,
      description: '30 Days Full Access - JT Group of Institution',
      customer: {
        name: user.name || 'Test User',
        email: user.email || 'test@example.com'
      },
      notify: {
        sms: false,
        email: false
      },
      reminder_enable: false,
      notes: {
        userId: String(userId),
        plan: '30 Days Full Access'
      },
      callback_url: `${req.protocol}://${req.get('host')}/api/payment/verify-redirect?userId=${userId}`,
      callback_method: 'get'
    });

    console.log('Payment link created:', paymentLink.short_url);
    console.log('Payment link ID:', paymentLink.id);
    console.log('Reference ID:', paymentLink.reference_id);

    // Return the hosted URL - frontend will redirect to this
    res.json({
      hostedUrl: paymentLink.short_url,
      orderId: paymentLink.reference_id
    });

  } catch (err) {
    console.error('Order creation failed:', err);
    res.status(500).json({ error: 'Failed to create payment: ' + err.message });
  }
});

// Verify Payment (with signature check - like fullstack)
router.post('/verify', async (req, res) => {
  const { razorpay_order_id, razorpay_payment_id, razorpay_signature, userId: bodyUserId } = req.body;

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
    // Get userId from order notes (more reliable than cookies for redirects)
    let userId = bodyUserId;
    
    if (!userId) {
      // Try to get from Razorpay order
      try {
        const order = await razorpay.orders.fetch(razorpay_order_id);
        userId = order.notes?.userId;
      } catch (e) {
        console.error('Failed to fetch order:', e.message);
      }
    }

    if (!userId) {
      return res.status(400).json({ error: 'User ID not found' });
    }

    // Check if subscription already exists (idempotency)
    const existingSub = db.prepare("SELECT * FROM subscriptions WHERE razorpay_order_id = ?").get(razorpay_order_id);
    if (existingSub) {
      return res.json({ success: true, validUntil: existingSub.valid_until });
    }

    // Check for existing active subscription
    const existingActiveSub = db.prepare("SELECT * FROM subscriptions WHERE user_id = ? AND datetime(valid_until) > datetime('now') ORDER BY valid_until DESC LIMIT 1").get(userId);

    if (existingActiveSub) {
      // EXTEND existing subscription by 30 days from current valid_until
      const result = db.prepare("SELECT datetime(valid_until, '+30 days') as newDate FROM subscriptions WHERE id = ?").get(existingActiveSub.id);
      const newValidUntil = result.newDate;
      
      db.prepare("UPDATE subscriptions SET valid_until = ?, razorpay_payment_id = ?, razorpay_order_id = ? WHERE id = ?").run(
        newValidUntil, 
        razorpay_payment_id, 
        razorpay_order_id, 
        existingActiveSub.id
      );
      
      console.log('Subscription EXTENDED for user:', userId, 'new valid until:', newValidUntil);
      res.json({ success: true, validUntil: newValidUntil });
    } else {
      // CREATE new subscription starting from now
      const result = db.prepare("SELECT datetime('now', '+30 days') as newDate").get();
      const validUntil = result.newDate;
      
      db.prepare('INSERT INTO subscriptions (user_id, razorpay_order_id, razorpay_payment_id, amount, valid_until) VALUES (?, ?, ?, ?, ?)').run(
        userId, 
        razorpay_order_id, 
        razorpay_payment_id, 
        process.env.PLAN_PRICE_INR || 29, 
        validUntil
      );
      
      console.log('New subscription created for user:', userId, 'valid until:', validUntil);
      res.json({ success: true, validUntil });
    }
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

// Handle Razorpay redirect from Payment Links
router.all('/verify-redirect', express.json(), async (req, res) => {
  const data = req.method === 'POST' ? req.body : req.query;
  const { razorpay_payment_id, razorpay_payment_link_id, razorpay_payment_link_reference_id } = data;

  console.log('=== Verify Redirect Called ===');
  console.log('Full query/body:', JSON.stringify(data));

  if (!razorpay_payment_id) {
    console.error('No payment_id in callback');
    return res.redirect('/app/payment.html?error=payment_failed');
  }

  try {
    if (!razorpay) {
      return res.redirect('/app/payment.html?error=razorpay_not_configured');
    }

    let userId = data.userId; // From callback_url query string
    let orderId = razorpay_payment_link_reference_id || razorpay_payment_link_id;

    console.log('UserId from query:', userId);

    // If userId not in query, try to get from payment link notes
    if (!userId && razorpay_payment_link_id) {
      try {
        const paymentLink = await razorpay.paymentLink.fetch(razorpay_payment_link_id);
        console.log('Payment Link fetched:', paymentLink.id);
        console.log('Payment Link notes:', JSON.stringify(paymentLink.notes));
        userId = paymentLink.notes?.userId;
      } catch (err) {
        console.error('Failed to fetch payment link:', err.message);
      }
    }

    if (!userId) {
      console.error('No userId found');
      return res.redirect('/app/payment.html?error=user_not_found');
    }

    console.log('Processing payment for userId:', userId, 'payment_id:', razorpay_payment_id);

    // Check if subscription already exists (idempotency)
    const existingSub = db.prepare("SELECT * FROM subscriptions WHERE razorpay_payment_id = ?").get(razorpay_payment_id);
    if (existingSub) {
      console.log('Subscription already exists for this payment');
      return res.redirect('/app/payment.html?success=true');
    }

    // Check for existing active subscription
    const existingActiveSub = db.prepare("SELECT * FROM subscriptions WHERE user_id = ? AND datetime(valid_until) > datetime('now') ORDER BY valid_until DESC LIMIT 1").get(userId);
    
    console.log('Existing active subscription:', existingActiveSub);

    if (existingActiveSub) {
      // EXTEND existing subscription by 30 days from current valid_until
      console.log('Found existing subscription, current valid_until:', existingActiveSub.valid_until);
      
      // Calculate new date using the existing subscription's valid_until
      const result = db.prepare("SELECT datetime(valid_until, '+30 days') as newDate FROM subscriptions WHERE id = ?").get(existingActiveSub.id);
      const newValidUntil = result.newDate;
      
      console.log('Extending subscription from', existingActiveSub.valid_until, 'to', newValidUntil);
      
      // Update the existing subscription - pass parameters as array
      const updateResult = db.prepare("UPDATE subscriptions SET valid_until = ?, razorpay_payment_id = ?, razorpay_order_id = ? WHERE id = ?").run(
        newValidUntil, 
        razorpay_payment_id, 
        orderId || razorpay_payment_link_id, 
        existingActiveSub.id
      );
      
      console.log('Update result:', updateResult);
      console.log('✓ Subscription EXTENDED for user:', userId, 'new valid until:', newValidUntil);
    } else {
      // CREATE new subscription starting from now
      const result = db.prepare("SELECT datetime('now', '+30 days') as newDate").get();
      const validUntil = result.newDate;
      
      const insertResult = db.prepare('INSERT INTO subscriptions (user_id, razorpay_order_id, razorpay_payment_id, amount, valid_until) VALUES (?, ?, ?, ?, ?)').run(
        userId, 
        orderId || razorpay_payment_link_id, 
        razorpay_payment_id, 
        process.env.PLAN_PRICE_INR || 29, 
        validUntil
      );
      
      console.log('Insert result:', insertResult);
      console.log('✓ New subscription created for user:', userId, 'valid until:', validUntil);
    }

    res.redirect('/app/payment.html?success=true');

  } catch (err) {
    console.error('Redirect verification failed:', err);
    console.error('Stack:', err.stack);
    res.redirect('/app/payment.html?error=verification_failed');
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
      const paymentLinkEntity = event.payload?.payment_link?.entity;

      // Handle payment link payments
      if (paymentEntity && paymentLinkEntity) {
        const userId = paymentLinkEntity.notes?.userId;

        if (userId) {
          const existingSub = db.prepare("SELECT * FROM subscriptions WHERE razorpay_payment_id = ?").get(paymentEntity.id);
          if (!existingSub) {
            const existingActiveSub = db.prepare("SELECT * FROM subscriptions WHERE user_id = ? AND datetime(valid_until) > datetime('now') ORDER BY valid_until DESC LIMIT 1").get(userId);

            if (existingActiveSub) {
              // EXTEND existing subscription
              const result = db.prepare("SELECT datetime(valid_until, '+30 days') as newDate FROM subscriptions WHERE id = ?").get(existingActiveSub.id);
              const newValidUntil = result.newDate;
              
              db.prepare("UPDATE subscriptions SET valid_until = ?, razorpay_payment_id = ?, razorpay_order_id = ? WHERE id = ?").run(
                newValidUntil, 
                paymentEntity.id, 
                paymentLinkEntity.id, 
                existingActiveSub.id
              );
              
              console.log('Webhook: Subscription EXTENDED for user:', userId, 'new valid until:', newValidUntil);
            } else {
              // CREATE new subscription
              const result = db.prepare("SELECT datetime('now', '+30 days') as newDate").get();
              const validUntil = result.newDate;
              
              db.prepare('INSERT INTO subscriptions (user_id, razorpay_order_id, razorpay_payment_id, amount, valid_until) VALUES (?, ?, ?, ?, ?)').run(
                userId, 
                paymentLinkEntity.id, 
                paymentEntity.id, 
                process.env.PLAN_PRICE_INR || 29, 
                validUntil
              );
              
              console.log('Webhook: New subscription created for user:', userId, 'valid until:', validUntil);
            }
          }
        }
      }
      
      // Handle regular order payments (fallback)
      if (paymentEntity && orderEntity && !paymentLinkEntity) {
        const userId = orderEntity.notes?.userId;

        if (userId) {
          const existingSub = db.prepare("SELECT * FROM subscriptions WHERE razorpay_order_id = ?").get(orderEntity.id);
          if (!existingSub) {
            const existingActiveSub = db.prepare("SELECT * FROM subscriptions WHERE user_id = ? AND datetime(valid_until) > datetime('now') ORDER BY valid_until DESC LIMIT 1").get(userId);

            if (existingActiveSub) {
              // EXTEND existing subscription
              const result = db.prepare("SELECT datetime(valid_until, '+30 days') as newDate FROM subscriptions WHERE id = ?").get(existingActiveSub.id);
              const newValidUntil = result.newDate;
              
              db.prepare("UPDATE subscriptions SET valid_until = ?, razorpay_payment_id = ? WHERE id = ?").run(newValidUntil, paymentEntity.id, existingActiveSub.id);
              
              console.log('Webhook: Subscription EXTENDED for user:', userId, 'new valid until:', newValidUntil);
            } else {
              // CREATE new subscription
              const result = db.prepare("SELECT datetime('now', '+30 days') as newDate").get();
              const validUntil = result.newDate;
              
              db.prepare('INSERT INTO subscriptions (user_id, razorpay_order_id, razorpay_payment_id, amount, valid_until) VALUES (?, ?, ?, ?, ?)').run(userId, orderEntity.id, paymentEntity.id, process.env.PLAN_PRICE_INR || 29, validUntil);
              
              console.log('Webhook: New subscription created for user:', userId, 'valid until:', validUntil);
            }
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
