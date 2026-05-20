const express = require('express');
const path = require('path');
const fs = require('fs');
const db = require('../db/database');

const router = express.Router();

// Course structure for each language (folder names match actual directory structure)
const courseStructure = {
  'tamil': {
    'WEB_DEVELOPMENT': {
      name: 'Web Development',
      icon: 'fa-globe',
      courses: [
        { name: 'HTML', folder: 'WEB_HTML' },
        { name: 'CSS', folder: 'WEB_CSS' },
        { name: 'JavaScript', folder: 'WEB_JAVASCRIPT' }
      ]
    },
    'FRONT_END_DEVELOPMENT': {
      name: 'Front End Development',
      icon: 'fa-code',
      courses: [
        { name: 'HTML', folder: 'front_HTML' },
        { name: 'CSS', folder: 'front_CSS' },
        { name: 'JavaScript', folder: 'front_JAVASCRIPT' }
      ]
    },
    'full stack development': {
      name: 'Full Stack Development',
      icon: 'fa-layer-group',
      courses: [
        { name: 'HTML', folder: 'HTML' },
        { name: 'CSS', folder: 'CSS' },
        { name: 'JavaScript', folder: 'JAVASCRIPT' },
        { name: 'Angular', folder: 'ANGULAR' },
        { name: 'Angular JS', folder: 'ANGULAR_JS' },
        { name: 'Node.js', folder: 'NODE_JS' },
        { name: 'MongoDB', folder: 'MONGO_DB' },
        { name: 'Python', folder: 'PYTHON' },
        { name: 'MySQL', folder: 'MY_SQL' },
        { name: 'SQL', folder: 'SQL' }
      ]
    },
    'backend development': {
      name: 'Backend Development',
      icon: 'fa-server',
      courses: [
        { name: 'Python', folder: 'PYTHON' },
        { name: 'Node.js', folder: 'NODE_JS' }
      ]
    },
    'programming-languages': {
      name: 'Programming Languages',
      icon: 'fa-laptop-code',
      courses: [
        { name: 'Python', folder: 'PYTHON' },
        { name: 'JavaScript', folder: 'JAVASCRIPT' },
        { name: 'HTML', folder: 'HTML' },
        { name: 'CSS', folder: 'CSS' },
        { name: 'MongoDB', folder: 'MONGO_DB' },
        { name: 'Angular', folder: 'ANGULAR' },
        { name: 'Angular JS', folder: 'ANGULAR_JS' },
        { name: 'Git', folder: 'GIT' },
        { name: 'MySQL', folder: 'MY_SQL' },
        { name: 'SQL', folder: 'SQL' },
        { name: 'Node.js', folder: 'NODE_JS' }
      ]
    },
    'database': {
      name: 'Database Courses',
      icon: 'fa-database',
      courses: [
        { name: 'MySQL', folder: 'MY_SQL' },
        { name: 'SQL', folder: 'SQL' },
        { name: 'MongoDB', folder: 'MONGO_DB' }
      ]
    }
  },
  'telugu': {
    'WEB_DEVELOPMENT': {
      name: 'Web Development',
      icon: 'fa-globe',
      courses: [
        { name: 'HTML', folder: 'WEB_HTML' },
        { name: 'CSS', folder: 'WEB_CSS' },
        { name: 'JavaScript', folder: 'WEB_JAVASCRIPT' }
      ]
    },
    'FRONT_END_DEVELOPMENT': {
      name: 'Front End Development',
      icon: 'fa-code',
      courses: [
        { name: 'HTML', folder: 'front_HTML' },
        { name: 'CSS', folder: 'front_CSS' },
        { name: 'JavaScript', folder: 'front_JAVASCRIPT' }
      ]
    },
    'full stack development': {
      name: 'Full Stack Development',
      icon: 'fa-layer-group',
      courses: [
        { name: 'HTML', folder: 'HTML' },
        { name: 'CSS', folder: 'CSS' },
        { name: 'JavaScript', folder: 'JAVASCRIPT' },
        { name: 'Angular', folder: 'ANGULAR' },
        { name: 'Angular JS', folder: 'ANGULAR_JS' },
        { name: 'Node.js', folder: 'NODE_JS' },
        { name: 'MongoDB', folder: 'MONGO_DB' },
        { name: 'Python', folder: 'PYTHON' },
        { name: 'MySQL', folder: 'MY_SQL' },
        { name: 'SQL', folder: 'SQL' }
      ]
    },
    'backend development': {
      name: 'Backend Development',
      icon: 'fa-server',
      courses: [
        { name: 'Python', folder: 'PYTHON' },
        { name: 'Node.js', folder: 'NODE_JS' }
      ]
    },
    'programming-languages': {
      name: 'Programming Languages',
      icon: 'fa-laptop-code',
      courses: [
        { name: 'Python', folder: 'PYTHON' },
        { name: 'JavaScript', folder: 'JAVASCRIPT' },
        { name: 'HTML', folder: 'HTML' },
        { name: 'CSS', folder: 'CSS' },
        { name: 'MongoDB', folder: 'MONGO_DB' },
        { name: 'Angular', folder: 'ANGULAR' },
        { name: 'Angular JS', folder: 'ANGULAR_JS' },
        { name: 'Git', folder: 'GIT' },
        { name: 'MySQL', folder: 'MY_SQL' },
        { name: 'SQL', folder: 'SQL' },
        { name: 'Node.js', folder: 'NODE_JS' }
      ]
    },
    'database': {
      name: 'Database Courses',
      icon: 'fa-database',
      courses: [
        { name: 'MySQL', folder: 'MY_SQL' },
        { name: 'SQL', folder: 'SQL' },
        { name: 'MongoDB', folder: 'MONGO_DB' }
      ]
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

  let courses = courseStructure[language];
  let hasCourses = Object.keys(courses).length > 0;

  // Fallback to Tamil courses for languages without their own content
  if (!hasCourses && language !== 'tamil') {
    courses = courseStructure['tamil'];
    hasCourses = true;
  }

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
    // Security: Prevent directory traversal
    if (course.includes('..') || course.includes('//') || course.includes('/')) {
      return res.status(403).send('Forbidden');
    }

    // Serve specific course index.html
    const coursePath = path.join(basePath, course, 'index.html');
    const resolvedPath = path.resolve(coursePath);
    const coursesRoot = path.resolve(path.join(__dirname, '../../../public/courses'));

    if (!resolvedPath.startsWith(coursesRoot)) {
      return res.status(403).send('Forbidden');
    }

    res.sendFile(coursePath);
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

        categoryInfo.courses.forEach(courseItem => {
          html += `
          <div class="course-card">
            <h3>${courseItem.name}</h3>
            <a href="?course=${courseItem.folder}">Start Learning</a>
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
