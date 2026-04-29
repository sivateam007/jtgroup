const fs = require('fs');
const path = require('path');

console.log('=== JT Group of Institution - Deployment Readiness Check ===\n');

const checks = [
  { name: 'Server file', path: 'backend/src/server.js' },
  { name: 'Database module', path: 'backend/src/db/database.js' },
  { name: 'Auth routes', path: 'backend/src/routes/auth.js' },
  { name: 'Payment routes', path: 'backend/src/routes/payment.js' },
  { name: 'Course routes', path: 'backend/src/routes/courses.js' },
  { name: 'Access control middleware', path: 'backend/src/middleware/accessControl.js' },
  { name: 'Landing page', path: 'public/app/index.html' },
  { name: 'Login page', path: 'public/app/login.html' },
  { name: 'Signup page', path: 'public/app/signup.html' },
  { name: 'Dashboard page', path: 'public/app/dashboard.html' },
  { name: 'Payment page', path: 'public/app/payment.html' },
  { name: 'Style CSS', path: 'public/assets/css/style.css' },
  { name: 'Logo image', path: 'public/assets/images/jt_logo.jpeg' },
  { name: 'Env file', path: '.env' },
  { name: 'Package.json', path: 'package.json' },
  { name: 'Deployment guide', path: 'DEPLOYMENT.md' },
  { name: 'Tamil courses folder', path: 'public/courses/tamil' },
  { name: 'Backend development index', path: 'public/courses/tamil/backend development/index.html' }
];

let allPassed = true;

checks.forEach(check => {
  const exists = fs.existsSync(check.path);
  const status = exists ? '✓' : '✗';
  console.log(`${status} ${check.name}: ${check.path}`);
  if (!exists) allPassed = false;
});

console.log('\n=== Course Categories (Tamil) ===');
const categories = fs.readdirSync('public/courses/tamil').filter(f => 
  fs.statSync(path.join('public/courses/tamil', f)).isDirectory()
);
categories.forEach(cat => console.log(`  ✓ ${cat}`));

console.log('\n=== Database Check ===');
try {
  const db = require('./backend/src/db/database.js');
  const users = db.prepare('SELECT count(*) as c FROM users').get();
  const subs = db.prepare('SELECT count(*) as c FROM subscriptions').get();
  console.log(`  ✓ Users: ${users.c}`);
  console.log(`  ✓ Subscriptions: ${subs.c}`);
  console.log('  ✓ Database connected');
} catch(e) {
  console.log('  ✗ Database error:', e.message);
  allPassed = false;
}

console.log('\n=== Final Result ===');
if (allPassed) {
  console.log('✓ ALL CHECKS PASSED - Ready for testing and deployment!');
} else {
  console.log('✗ Some checks failed - Review above');
}

console.log('\n=== Next Steps ===');
console.log('1. Test in browser: http://localhost:3000');
console.log('2. Signup → Dashboard → Payment (₹29) → Access courses');
console.log('3. Deploy to Hostinger VPS using DEPLOYMENT.md');
