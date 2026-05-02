const fs = require('fs');
const path = require('path');

const dir = 'C:\\Users\\siva\\Desktop\\jtgroupofinstitution\\public\\courses\\tamil\\full stack development';
const indexPath = path.join(dir, 'index.html');

if (!fs.existsSync(indexPath)) {
  console.log('File not found');
  process.exit(1);
}

const content = fs.readFileSync(indexPath, 'utf8');

// Generate topic cards for subdirectories
const subdirs = [
  { name: 'ANGULAR', icon: 'fab fa-angular', desc: 'Build modern web apps with Angular' },
  { name: 'ANGULAR_JS', icon: 'fab fa-angular', desc: 'Learn Angular JS for web apps' },
  { name: 'CSS', icon: 'fab fa-css3-alt', desc: 'Master CSS for styling' },
  { name: 'HTML', icon: 'fab fa-html5', desc: 'Learn HTML5 fundamentals' },
  { name: 'JAVASCRIPT', icon: 'fab fa-js-square', desc: 'Master JavaScript' },
  { name: 'MONGO_DB', icon: 'fas fa-database', desc: 'Learn MongoDB NoSQL' },
  { name: 'NODE_JS', icon: 'fab fa-node-js', desc: 'Build server apps with Node.js' },
];

let topicCards = '';
subdirs.forEach((item, idx) => {
  const isFirst = idx === 0;
  const extraStyle = isFirst ? ' style="border-top: 5px solid #e74c3c;"' : '';
  
  topicCards += `        <div class="topic-card"${extraStyle}>\n`;
  topicCards += `            <div class="topic-icon">\n`;
  topicCards += `                <i class="${item.icon}"></i>\n`;
  topicCards += `            </div>\n`;
  topicCards += `            <h3>${item.name}</h3>\n`;
  topicCards += `            <p>${item.desc}</p>\n`;
  topicCards += `            <a href="${item.name}/" class="start-learning-btn">Start Learning <i class="fas fa-arrow-right"></i></a>\n`;
  topicCards += `        </div>\n`;
});

// Find topics-grid and replace
const startMarker = '<div class="topics-grid">';
const endMarker = '</div>\n</div>\n\n    <!-- Footer -->';

const startIndex = content.indexOf(startMarker);
const endIndex = content.indexOf(endMarker);

if (startIndex !== -1 && endIndex !== -1) {
  const before = content.substring(0, startIndex + startMarker.length);
  const after = content.substring(endIndex + endMarker.length);
  
  const newContent = before + '\n' + topicCards + '        </div>\n    </div>\n' + after;
  fs.writeFileSync(indexPath, newContent);
  console.log(`Fixed: full stack development (${subdirs.length} topics)`);
} else {
  console.log('Could not find markers');
  console.log('startMarker index:', startIndex);
  console.log('endMarker index:', endIndex);
}
