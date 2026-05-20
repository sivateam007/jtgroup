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

// Trust first proxy (required for Render/X-Forwarded-For/rate limiter)
app.set('trust proxy', 1);

// Security: Add security headers
app.use(helmet({
  contentSecurityPolicy: false, // Disable CSP for now to avoid breaking inline scripts
  crossOriginEmbedderPolicy: false
}));

// Rate limiting for auth endpoints (skip in test mode)
const authLimiter = rateLimit({
  windowMs: 5 * 60 * 1000, // 5 minutes (changed from 15)
  max: process.env.NODE_ENV === 'production' ? 50 : 1000, // 50 in production (changed from 10), 1000 in test mode
  message: { error: 'Too many requests, please try again later.' },
  standardHeaders: true,
  legacyHeaders: false,
  skip: () => {
    // Skip rate limiting entirely in non-production
    return process.env.NODE_ENV !== 'production';
  }
});

// Payment rate limiter removed - payment endpoints don't need rate limiting
// as users only pay once (not susceptible to brute force like login)


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
app.use('/api/payment', auth, paymentRoutes); // Add auth middleware to protect payment routes
app.use('/api/courses', courseRoutes);
app.use('/api/progress', auth, progressRoutes);

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
    let indexPath = path.join(__dirname, '../../public/courses', subPath, 'index.html');

    // Security: Ensure the resolved path is within the courses directory
    let resolvedPath = path.resolve(indexPath);
    const coursesRoot = path.resolve(path.join(__dirname, '../../public/courses'));
    if (!resolvedPath.startsWith(coursesRoot)) {
      return res.status(403).send('Forbidden');
    }

    if (require('fs').existsSync(indexPath)) {
      return res.sendFile(indexPath);
    }

    // Fallback: if language folder doesn't exist, try serving from Tamil
    const langMatch = subPath.match(/^([^/]+)/);
    if (langMatch && langMatch[1] !== 'tamil') {
      const fallbackPath = subPath.replace(/^[^/]+/, 'tamil');
      indexPath = path.join(__dirname, '../../public/courses', fallbackPath, 'index.html');
      resolvedPath = path.resolve(indexPath);
      if (resolvedPath.startsWith(coursesRoot) && require('fs').existsSync(indexPath)) {
        return res.sendFile(indexPath);
      }
    }
  }
  next();
});

// Serve course content with access control (must be after the public routes)
app.use('/courses', require('./middleware/accessControl'), express.static(path.join(__dirname, '../../public/courses')));

// Fallback: serve Tamil course files for languages that don't have their own folder
app.use('/courses', (req, res, next) => {
  const langMatch = req.path.match(/^\/([^/]+)/);
  if (langMatch && langMatch[1] !== 'tamil') {
    const tamilPath = req.path.replace(/^\/[^/]+/, '/tamil');
    const filePath = path.join(__dirname, '../../public/courses', tamilPath);
    if (require('fs').existsSync(filePath)) {
      return res.sendFile(filePath);
    }
  }
  next();
});

// Landing page
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, '../../public/app/index.html'));
});

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
