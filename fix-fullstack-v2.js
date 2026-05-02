const fs = require('fs');
const path = require('path');

const indexPath = 'C:\\Users\\siva\\Desktop\\jtgroupofinstitution\\public\\courses\\tamil\\full stack development\\index.html';

if (!fs.existsSync(indexPath)) {
  console.log('File not found');
  process.exit(1);
}

let content = fs.readFileSync(indexPath, 'utf8');

// New topic cards - only show actual subdirectories
const newTopicCards = `        <div class="topic-card" style="border-top: 5px solid #e74c3c;">
            <div class="topic-icon">
                <i class="fab fa-angular"></i>
            </div>
            <h3>ANGULAR</h3>
            <p>Build modern web applications with Angular framework</p>
            <a href="ANGULAR/" class="start-learning-btn">Start Learning <i class="fas fa-arrow-right"></i></a>
        </div>
        <div class="topic-card">
            <div class="topic-icon">
                <i class="fab fa-angular"></i>
            </div>
            <h3>ANGULAR_JS</h3>
            <p>Learn Angular JS for dynamic web apps</p>
            <a href="ANGULAR_JS/" class="start-learning-btn">Start Learning <i class="fas fa-arrow-right"></i></a>
        </div>
        <div class="topic-card">
            <div class="topic-icon">
                <i class="fab fa-css3-alt"></i>
            </div>
            <h3>CSS</h3>
            <p>Master CSS for styling web pages</p>
            <a href="CSS/" class="start-learning-btn">Start Learning <i class="fas fa-arrow-right"></i></a>
        </div>
        <div class="topic-card">
            <div class="topic-icon">
                <i class="fab fa-html5"></i>
            </div>
            <h3>HTML</h3>
            <p>Learn HTML5 for structuring web pages</p>
            <a href="HTML/" class="start-learning-btn">Start Learning <i class="fas fa-arrow-right"></i></a>
        </div>
        <div class="topic-card">
            <div class="topic-icon">
                <i class="fab fa-js-square"></i>
            </div>
            <h3>JAVASCRIPT</h3>
            <p>Master JavaScript for web interactivity</p>
            <a href="JAVASCRIPT/" class="start-learning-btn">Start Learning <i class="fas fa-arrow-right"></i></a>
        </div>
        <div class="topic-card">
            <div class="topic-icon">
                <i class="fas fa-database"></i>
            </div>
            <h3>MONGO_DB</h3>
            <p>Learn MongoDB NoSQL database</p>
            <a href="MONGO_DB/" class="start-learning-btn">Start Learning <i class="fas fa-arrow-right"></i></a>
        </div>
        <div class="topic-card">
            <div class="topic-icon">
                <i class="fab fa-node-js"></i>
            </div>
            <h3>NODE_JS</h3>
            <p>Build server-side apps with Node.js</p>
            <a href="NODE_JS/" class="start-learning-btn">Start Learning <i class="fas fa-arrow-right"></i></a>
        </div>
        `;

// Find the topics-grid section and replace everything inside it
const startMarker = '<div class="topics-grid">';
const endMarker = '</div>\n</div>\n\n    <!-- Footer -->';

const startIndex = content.indexOf(startMarker);
const endIndex = content.indexOf(endMarker);

if (startIndex !== -1 && endIndex !== -1) {
  const before = content.substring(0, startIndex + startMarker.length);
  const after = content.substring(endIndex);
  
  const newContent = before + '\n' + newTopicCards + after;
  fs.writeFileSync(indexPath, newContent);
  console.log('Fixed: full stack development (7 topics)');
} else {
  console.log('Could not find markers');
  console.log('startIndex:', startIndex);
  console.log('endIndex:', endIndex);
}
