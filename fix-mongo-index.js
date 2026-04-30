const fs = require('fs');
const path = require('path');

const dir = 'C:\\Users\\siva\\Desktop\\jtgroupofinstitution\\public\\courses\\tamil\\database\\MONGO_DB';
const indexPath = path.join(dir, 'index.html');

if (!fs.existsSync(indexPath)) {
  console.log('File not found');
  process.exit(1);
}

const content = fs.readFileSync(indexPath, 'utf8');

// Get all HTML files
const files = fs.readdirSync(dir)
  .filter(f => f.endsWith('.html') && 
    f !== 'index.html' && 
    !f.toLowerCase().includes('easy') &&
    !f.toLowerCase().includes('certificate') &&
    !f.toLowerCase().includes('answer') &&
    !f.toLowerCase().includes('key'))
  .sort();

console.log(`Found ${files.length} HTML files`);

// Generate topic cards
let topicCards = '';
files.forEach((file, idx) => {
  const title = file.replace('.html', '');
  const isFirst = idx === 0;
  const extraStyle = isFirst ? ' style="border-top: 5px solid #e74c3c;"' : '';
  
  topicCards += `            <div class="topic-card"${extraStyle}>\n`;
  topicCards += `                <div class="topic-icon">\n`;
  topicCards += `                    <i class="fas fa-database"></i>\n`;
  topicCards += `                </div>\n`;
  topicCards += `                <h3>${title}</h3>\n`;
  topicCards += `                <p>Learn ${title}</p>\n`;
  topicCards += `                <a href="${file}">Start Learning <i class="fas fa-arrow-right"></i></a>\n`;
  topicCards += `            </div>\n`;
});

// Find and replace topics-grid content
const startMarker = '<div class="topics-grid">';
const endMarker = '<!-- Footer -->';

const startIndex = content.indexOf(startMarker);
const endIndex = content.indexOf(endMarker);

if (startIndex !== -1 && endIndex !== -1) {
  const before = content.substring(0, startIndex + startMarker.length);
  const after = content.substring(endIndex);
  
  const newContent = before + '\n' + topicCards + '        </div>\n    </div>\n\n    ' + after;
  fs.writeFileSync(indexPath, newContent);
  console.log(`Fixed: MONGO_DB (${files.length} topics)`);
} else {
  console.log('Could not find markers');
}
