const express = require('express');
const db = require('../db/database');

const router = express.Router();

// Update progress
router.post('/', (req, res) => {
  const { coursePath, timeSpent } = req.body;
  const userId = req.user.id;
  
  try {
    const existing = db.prepare('SELECT * FROM progress WHERE user_id = ? AND course_path = ?').get(userId, coursePath);
    
    if (existing) {
      const stmt = db.prepare('UPDATE progress SET time_spent_seconds = time_spent_seconds + ?, last_accessed = datetime("now") WHERE user_id = ? AND course_path = ?');
      stmt.run(timeSpent || 0, userId, coursePath);
    } else {
      const stmt = db.prepare('INSERT INTO progress (user_id, course_path, time_spent_seconds) VALUES (?, ?, ?)');
      stmt.run(userId, coursePath, timeSpent || 0);
    }
    
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: 'Failed to update progress' });
  }
});

// Get progress for a course
router.get('/:coursePath', (req, res) => {
  const { coursePath } = req.params;
  const userId = req.user.id;
  
  try {
    const progress = db.prepare('SELECT * FROM progress WHERE user_id = ? AND course_path = ?').get(userId, coursePath);
    res.json(progress || { time_spent_seconds: 0 });
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
});

// Get all progress for user
router.get('/', (req, res) => {
  const userId = req.user.id;
  
  try {
    const progress = db.prepare('SELECT * FROM progress WHERE user_id = ?').all(userId);
    res.json(progress);
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
});

module.exports = router;
