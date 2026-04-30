require('dotenv').config();
const express = require('express');
const path = require('path');
const cookieParser = require('cookie-parser');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const authRoutes = require('./routes/auth');
const paymentRoutes = require('./routes/payment');
const courseRoutes = require('./routes/courses');
const progressRoutes = require('./routes/progress');
const auth = require('./middleware/auth');

const app = express();
const PORT = process.env.PORT || 3000;

// Security: Add security headers
app.use(helmet({
  contentSecurityPolicy: false, // Disable CSP for now to avoid breaking inline scripts
  crossOriginEmbedderPolicy: false
}));

// Rate limiting for auth endpoints (skip in test mode)
const authLimiter = rateLimit({
  windowMs: 5 * 60 * 1000, // 5 minutes (changed from 15)
  max: process.env.NODE_ENV === 'production' ? 50 : 100, // 50 in production (changed from 10), 100 in test mode
  message: { error: 'Too many requests, please try again later.' },
  standardHeaders: true,
  legacyHeaders: false,
  skip: (req) => process.env.NODE_ENV !== 'production' // Disable in non-production
});

// Rate limiting for payment endpoints (skip in test mode)
const paymentLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: process.env.NODE_ENV === 'production' ? 5 : 100, // 100 in test mode
  message: { error: 'Too many payment attempts, please try again later.' },
  standardHeaders: true,
  legacyHeaders: false,
  skip: (req) => process.env.NODE_ENV !== 'production' // Disable in non-production
});

// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

// Serve static assets (public, no auth required)
app.use('/assets', express.static(path.join(__dirname, '../../public/assets')));

// Serve payment.html (only for authenticated users)
app.get('/app/payment.html', auth, (req, res) => {
  res.sendFile(path.join(__dirname, '../../public/app/payment.html'));
});

app.use('/app', express.static(path.join(__dirname, '../../public/app')));

// API routes with rate limiting
app.use('/api/auth', authLimiter, authRoutes);
app.use('/api/payment', paymentLimiter, paymentRoutes);
app.use('/api/courses', courseRoutes);
app.use('/api/progress', progressRoutes);

// Serve course category index pages (public - no auth required)
// Matches: /courses/tamil, /courses/tamil/programming-languages, /courses/tamil/programming-languages/HTML, etc.
app.use('/courses', (req, res, next) => {
  // Check if this is a request for an index.html page (ends with / or index.html)
  const urlPath = req.path;

  // Security: Prevent directory traversal
  if (urlPath.includes('..') || urlPath.includes('//')) {
    return res.status(403).send('Forbidden');
  }

  if (urlPath.endsWith('/') || urlPath.endsWith('index.html')) {
    // Extract the path after /courses/
    const subPath = urlPath.replace(/^\//, '').replace(/\/$/, '');
    const indexPath = path.join(__dirname, '../../public/courses', subPath, 'index.html');

    // Security: Ensure the resolved path is within the courses directory
    const resolvedPath = path.resolve(indexPath);
    const coursesRoot = path.resolve(path.join(__dirname, '../../public/courses'));
    if (!resolvedPath.startsWith(coursesRoot)) {
      return res.status(403).send('Forbidden');
    }

    if (require('fs').existsSync(indexPath)) {
      return res.sendFile(indexPath);
    }
  }
  next();
});

// Serve course content with access control (must be after the public routes)
app.use('/courses', require('./middleware/accessControl'), express.static(path.join(__dirname, '../../public/courses')));

// Landing page
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, '../../public/app/index.html'));
});

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
