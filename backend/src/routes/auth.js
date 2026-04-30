const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const validator = require('validator');
const db = require('../db/database');

const router = express.Router();

// Signup
router.post('/signup', (req, res) => {
  const { name, email, dob, password } = req.body;

  if (!name || !email || !dob || !password) {
    return res.status(400).json({ error: 'Name, email, DOB, and password are required' });
  }

  // Security: Validate email format
  if (!validator.isEmail(email)) {
    return res.status(400).json({ error: 'Invalid email format' });
  }

  // Security: Sanitize name (allow only letters, spaces, dots, hyphens)
  const sanitizedName = validator.whitelist(name, 'A-Za-z \\.\\-\\ ');
  if (sanitizedName !== name || name.length < 2 || name.length > 100) {
    return res.status(400).json({ error: 'Invalid name format' });
  }

  // Security: Validate date format (YYYY-MM-DD)
  if (!validator.isDate(dob, { format: 'YYYY-MM-DD', delimiters: ['-'] })) {
    return res.status(400).json({ error: 'Invalid date format. Use YYYY-MM-DD' });
  }

  if (password.length < 6) {
    return res.status(400).json({ error: 'Password must be at least 6 characters' });
  }

  try {
    const passwordHash = bcrypt.hashSync(password, 10);
    const stmt = db.prepare('INSERT INTO users (name, email, dob, password_hash) VALUES (?, ?, ?, ?)');
    const result = stmt.run(name, email, dob, passwordHash);

    const token = jwt.sign({ id: result.lastInsertRowid }, process.env.JWT_SECRET, { expiresIn: '7d' });

    res.cookie(process.env.JWT_COOKIE_NAME || 'jt_token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 7 * 24 * 60 * 60 * 1000 // 7 days
    });

    res.json({ success: true, userId: result.lastInsertRowid });
  } catch (err) {
    console.error('Signup error:', err);
    if (err.message.includes('UNIQUE')) {
      return res.status(400).json({ error: 'Email already registered' });
    }
    res.status(500).json({ error: 'Server error: ' + err.message });
  }
});

// Login
router.post('/login', (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({ error: 'Email and password required' });
  }

  // Security: Validate email format
  if (!validator.isEmail(email)) {
    return res.status(400).json({ error: 'Invalid email format' });
  }

  try {
    const user = db.prepare('SELECT * FROM users WHERE email = ?').get(email);

    if (!user || !bcrypt.compareSync(password, user.password_hash)) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    const token = jwt.sign({ id: user.id }, process.env.JWT_SECRET, { expiresIn: '7d' });

    res.cookie(process.env.JWT_COOKIE_NAME || 'jt_token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 7 * 24 * 60 * 60 * 1000
    });

    res.json({ success: true, userId: user.id });
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
});

// Get current user
router.get('/me', (req, res) => {
  const token = req.cookies[process.env.JWT_COOKIE_NAME || 'jt_token'];

  if (!token) {
    return res.status(401).json({ error: 'Not authenticated' });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const user = db.prepare('SELECT id, name, email, dob, created_at FROM users WHERE id = ?').get(decoded.id);

    if (!user) {
      return res.status(401).json({ error: 'User not found' });
    }

    res.json(user);
  } catch (err) {
    res.status(401).json({ error: 'Invalid token' });
  }
});

// Forgot Password - Verify email and DOB
router.post('/forgot-password', (req, res) => {
  const { email, dob } = req.body;

  if (!email || !dob) {
    return res.status(400).json({ error: 'Email and Date of Birth are required' });
  }

  // Security: Validate email format
  if (!validator.isEmail(email)) {
    return res.status(400).json({ error: 'Invalid email format' });
  }

  // Security: Validate date format
  if (!validator.isDate(dob, { format: 'YYYY-MM-DD', delimiters: ['-'] })) {
    return res.status(400).json({ error: 'Invalid date format' });
  }

  try {
    const user = db.prepare('SELECT * FROM users WHERE email = ? AND dob = ?').get(email, dob);

    if (!user) {
      return res.status(401).json({ error: 'Invalid email or date of birth' });
    }

    res.json({ success: true, message: 'Verification successful. You can now reset your password.' });
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
});

// Reset Password
router.post('/reset-password', (req, res) => {
  const { email, dob, newPassword } = req.body;

  if (!email || !dob || !newPassword) {
    return res.status(400).json({ error: 'Email, DOB, and new password are required' });
  }

  // Security: Validate email format
  if (!validator.isEmail(email)) {
    return res.status(400).json({ error: 'Invalid email format' });
  }

  // Security: Validate date format
  if (!validator.isDate(dob, { format: 'YYYY-MM-DD', delimiters: ['-'] })) {
    return res.status(400).json({ error: 'Invalid date format' });
  }

  if (newPassword.length < 6) {
    return res.status(400).json({ error: 'Password must be at least 6 characters' });
  }

  try {
    const user = db.prepare('SELECT * FROM users WHERE email = ? AND dob = ?').get(email, dob);

    if (!user) {
      return res.status(401).json({ error: 'Invalid email or date of birth' });
    }

    const passwordHash = bcrypt.hashSync(newPassword, 10);
    const stmt = db.prepare('UPDATE users SET password_hash = ? WHERE email = ? AND dob = ?');
    stmt.run(passwordHash, email, dob);

    res.json({ success: true, message: 'Password updated successfully' });
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
});

// Check auth status
router.get('/status', (req, res) => {
  const token = req.cookies[process.env.JWT_COOKIE_NAME || 'jt_token'];

  if (!token) {
    return res.json({ loggedIn: false });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const user = db.prepare('SELECT id, name, email FROM users WHERE id = ?').get(decoded.id);

    if (!user) {
      return res.json({ loggedIn: false });
    }

    res.json({ loggedIn: true, user });
  } catch (err) {
    res.json({ loggedIn: false });
  }
});

// Logout
router.post('/logout', (req, res) => {
  res.clearCookie(process.env.JWT_COOKIE_NAME || 'jt_token');
  res.json({ success: true });
});

module.exports = router;
