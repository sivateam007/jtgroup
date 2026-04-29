const Database = require('better-sqlite3');
const path = require('path');
const dbPath = path.join(__dirname, 'backend', 'data', 'app.db');
console.log('Using database:', dbPath);
const db = new Database(dbPath);

// Show all tables
console.log('\n=== DATABASE TABLES ===');
const tables = db.prepare("SELECT name FROM sqlite_master WHERE type='table'").all();
console.log(tables.map(t => t.name).join(', '));

// Show users
console.log('\n=== USERS ===');
const users = db.prepare('SELECT id, name, email, dob, created_at FROM users').all();
if (users.length === 0) {
    console.log('No users found. Sign up at http://localhost:3000/app/signup.html');
} else {
    users.forEach(u => {
        console.log(`ID: ${u.id}`);
        console.log(`Name: ${u.name || 'N/A'}`);
        console.log(`Email: ${u.email}`);
        console.log(`DOB: ${u.dob || 'N/A'}`);
        console.log(`Created: ${u.created_at}`);
        console.log('---');
    });
}

db.close();
