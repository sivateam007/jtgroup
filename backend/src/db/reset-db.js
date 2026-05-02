const Database = require('better-sqlite3');
const path = require('path');
const fs = require('fs');

const dataDir = path.join(__dirname, '../../data');
if (!fs.existsSync(dataDir)) {
  fs.mkdirSync(dataDir, { recursive: true });
}

const dbPath = path.join(dataDir, 'app.db');
if (fs.existsSync(dbPath)) {
  fs.unlinkSync(dbPath);
  console.log('Old database deleted');
}

const db = new Database(dbPath);

db.pragma('journal_mode = WAL');

// Create users table with correct SQL
db.exec('CREATE TABLE IF NOT EXISTS users (id INTEGER PRIMARY KEY AUTOINCREMENT, name TEXT, email TEXT UNIQUE NOT NULL, dob TEXT, password_hash TEXT NOT NULL, created_at DATETIME DEFAULT CURRENT_TIMESTAMP)');

// Create subscriptions table
db.exec('CREATE TABLE IF NOT EXISTS subscriptions (id INTEGER PRIMARY KEY AUTOINCREMENT, user_id INTEGER NOT NULL, razorpay_order_id TEXT, razorpay_payment_id TEXT, amount INTEGER DEFAULT 29, valid_until DATETIME, created_at DATETIME DEFAULT CURRENT_TIMESTAMP, FOREIGN KEY(user_id) REFERENCES users(id))');

// Create progress table
db.exec('CREATE TABLE IF NOT EXISTS progress (id INTEGER PRIMARY KEY AUTOINCREMENT, user_id INTEGER NOT NULL, course_path TEXT NOT NULL, time_spent_seconds INTEGER DEFAULT 0, last_accessed DATETIME DEFAULT CURRENT_TIMESTAMP, FOREIGN KEY(user_id) REFERENCES users(id))');

console.log('Database initialized successfully');

// Verify
const cols = db.prepare('PRAGMA table_info(users)').all();
console.log('Users table columns:');
cols.forEach(c => console.log('  ' + c.name + ' (' + c.type + ')'));

db.close();
