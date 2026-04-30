require('dotenv').config();
const express = require('express');
const path = require('path');
const cookieParser = require('cookie-parser');
const authRoutes = require('./routes/auth');
const paymentRoutes = require('./routes/payment');
const courseRoutes = require('./routes/courses');
const progressRoutes = require('./routes/progress');
const auth = require('./middleware/auth');

const app = express();
const PORT = process.env.PORT || 3000;

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

// API routes
app.use('/api/auth', authRoutes);
app.use('/api/payment', paymentRoutes);
app.use('/api/courses', courseRoutes);
app.use('/api/progress', progressRoutes);

// Serve course category index pages (public - no auth required)
// Matches: /courses/tamil, /courses/tamil/programming-languages, /courses/tamil/programming-languages/HTML, etc.
app.use('/courses', (req, res, next) => {
  // Check if this is a request for an index.html page (ends with / or index.html)
  const urlPath = req.path;
  if (urlPath.endsWith('/') || urlPath.endsWith('index.html')) {
    // Extract the path after /courses/
    const subPath = urlPath.replace(/^\//, '').replace(/\/$/, '');
    const indexPath = path.join(__dirname, '../../public/courses', subPath, 'index.html');
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
