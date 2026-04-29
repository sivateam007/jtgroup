const jwt = require('jsonwebtoken');
const db = require('../db/database');

const hasActiveSubscription = (req, res, next) => {
  const token = req.cookies[process.env.JWT_COOKIE_NAME || 'jt_token'];
  
  if (!token) {
    return res.redirect('/app/login.html');
  }
  
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const user = db.prepare('SELECT * FROM users WHERE id = ?').get(decoded.id);
    
    if (!user) {
      return res.redirect('/app/login.html');
    }
    
    // Check if subscription is valid using SQLite datetime() function (get latest)
    const sub = db.prepare("SELECT * FROM subscriptions WHERE user_id = ? AND datetime(valid_until) > datetime('now') ORDER BY valid_until DESC LIMIT 1").get(user.id);
    
    if (!sub) {
      return res.redirect('/app/payment.html');
    }
    
    req.user = user;
    next();
  } catch (err) {
    return res.redirect('/app/login.html');
  }
};

module.exports = hasActiveSubscription;
