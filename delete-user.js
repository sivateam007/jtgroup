const Database = require('better-sqlite3');
const path = require('path');

const dbPath = path.join(__dirname, 'data', 'app.db');
const db = new Database(dbPath);

// List all users
console.log('All users:');
const users = db.prepare('SELECT id, name, email FROM users').all();
console.log(users);

// To delete a user by email, uncomment and modify the line below:
// const emailToDelete = 'user@example.com';
// db.prepare('DELETE FROM users WHERE email = ?').run(emailToDelete);
// console.log(`Deleted user with email: ${emailToDelete}`);

db.close();
