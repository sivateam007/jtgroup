const express = require('express');
const path = require('path');
const fs = require('fs');
const db = require('../db/database');

const router = express.Router();

// Course structure for each language
const courseStructure = {
  'tamil': {
    'WEB_DEVELOPMENT': {
      name: 'Web Development',
      icon: 'fa-globe',
      courses: ['HTML', 'CSS', 'JAVASCRIPT']
    },
    'FRONT_END_DEVELOPMENT': {
      name: 'Front End Development',
      icon: 'fa-code',
      courses: ['HTML', 'CSS', 'JAVASCRIPT', 'GIT']
    },
    'full stack development': {
      name: 'Full Stack Development',
      icon: 'fa-layer-group',
      courses: ['HTML', 'CSS', 'JAVASCRIPT', 'ANGULAR', 'ANGULAR_JS', 'NODE_JS', 'MONGO_DB', 'PYTHON', 'MY_SQL', 'SQL']
    },
    'backend development': {
      name: 'Backend Development',
      icon: 'fa-server',
      courses: ['PYTHON', 'NODE_JS']
    },
    'programming-languages': {
      name: 'Programming Languages',
      icon: 'fa-laptop-code',
      courses: ['PYTHON', 'JAVASCRIPT', 'HTML', 'CSS', 'MONGO_DB', 'ANGULAR', 'ANGULAR_JS', 'GIT', 'MY_SQL', 'SQL', 'NODE_JS']
    },
    'database': {
      name: 'Database Courses',
      icon: 'fa-database',
      courses: ['MY_SQL', 'SQL', 'MONGO_DB']
    }
  },
  'hindi': {},
  'bengali': {},
  'malayalam': {}
};

// List all courses (optionally filter by language)
router.get('/', (req, res) => {
  const { language } = req.query;

  if (!language || !courseStructure[language]) {
    return res.status(400).json({ error: 'Invalid language' });
  }

  const courses = courseStructure[language];
  const hasCourses = Object.keys(courses).length > 0;

  res.json({
    language: language,
    courses: courses,
    basePath: `/courses/${language}`,
    hasCourses: hasCourses
  });
});

// Serve course index page for a language
router.get('/:language', (req, res) => {
  const { language } = req.params;
  const indexPath = path.join(__dirname, '../../../public/courses', language, 'index.html');

  if (fs.existsSync(indexPath)) {
    res.sendFile(indexPath);
  } else {
    res.send(`<h1>Courses for ${language} will be available soon!</h1><p><a href="/app/dashboard.html">Back to Dashboard</a></p>`);
  }
});

// Get specific course content (category index or specific course)
router.get('/:language/:category', (req, res) => {
  const { language, category } = req.params;
  const course = req.query.course;
  const basePath = path.join(__dirname, '../../../public/courses', language, category);

  if (course) {
    // Serve specific course index.html
    res.sendFile(path.join(basePath, course, 'index.html'));
  } else {
    // Serve category index page
    const indexPath = path.join(basePath, 'index.html');
    if (fs.existsSync(indexPath)) {
      res.sendFile(indexPath);
    } else {
      // Generate a simple index page listing available courses
      const categoryInfo = courseStructure[language]?.[category];
      if (categoryInfo) {
        let html = `<!DOCTYPE html>
<html>
<head>
  <title>${categoryInfo.name} - JT GROUP OF INSTITUTION</title>
  <link rel="stylesheet" href="/assets/css/style.css">
  <style>
    .course-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(300px, 1fr)); gap: 2rem; padding: 2rem; }
    .course-card { background: white; padding: 2rem; border-radius: 10px; box-shadow: 0 4px 15px rgba(0,0,0,0.1); }
    .course-card h3 { color: var(--primary); margin-top: 0; }
    .course-card a { display: inline-block; margin-top: 1rem; padding: 0.5rem 1rem; background: var(--primary); color: white; text-decoration: none; border-radius: 5px; }
    body { font-family: Arial, sans-serif; margin: 0; }
    .header { padding: 2rem; background: linear-gradient(135deg, var(--primary), var(--secondary)); color: white; }
    .header a { color: white; text-decoration: none; }
  </style>
</head>
<body>
  <div class="header">
    <h1>${categoryInfo.name}</h1>
    <a href="/app/dashboard.html">← Back to Dashboard</a>
  </div>
  <div class="course-grid">`;

        categoryInfo.courses.forEach(courseName => {
          html += `
          <div class="course-card">
            <h3>${courseName}</h3>
            <a href="?course=${courseName}">Start Learning</a>
          </div>`;
        });

        html += `</div></body></html>`;
        res.send(html);
      } else {
        res.send(`<h1>${category}</h1><p>Courses coming soon!</p><p><a href="/app/dashboard.html">Back to Dashboard</a></p>`);
      }
    }
  }
});

module.exports = router;
