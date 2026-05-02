const fs = require('fs');
const path = require('path');

const dir = 'C:\\Users\\siva\\Desktop\\jtgroupofinstitution\\public\\courses\\tamil\\programming-languages\\JAVASCRIPT';
const indexPath = path.join(dir, 'index.html');

// Read the current file
const content = fs.readFileSync(indexPath, 'utf8');

// Get all HTML files except index.html, easy.html, certificate.html, etc.
const files = fs.readdirSync(dir)
  .filter(f => f.endsWith('.html') && 
    f !== 'index.html' && 
    !f.toLowerCase().includes('easy') &&
    !f.toLowerCase().includes('certificate') &&
    !f.toLowerCase().includes('answer') &&
    !f.toLowerCase().includes('key'))
  .sort();

// Generate topic cards
let topicCards = '';
files.forEach((file, idx) => {
  const title = file.replace('.html', '');
  const isFirst = idx === 0;
  const extraStyle = isFirst ? ' style="border-top: 5px solid #e74c3c;"' : '';
  
  topicCards += `            <div class="topic-card"${extraStyle}>\n`;
  topicCards += `                <div class="topic-icon">\n`;
  topicCards += `                    <i class="fab fa-js-square"></i>\n`;
  topicCards += `                </div>\n`;
  topicCards += `                <h3>${title}</h3>\n`;
  topicCards += `                <p>Learn ${title}</p>\n`;
  topicCards += `                <a href="${file}">Start Learning <i class="fas fa-arrow-right"></i></a>\n`;
  topicCards += `            </div>\n`;
});

// Replace the topics section
const startMarker = '<div class="topics-grid">';
const endMarker = '<!-- Footer -->';
const startIndex = content.indexOf(startMarker);
const endIndex = content.indexOf(endMarker);

if (startIndex !== -1 && endIndex !== -1) {
  const newContent = content.substring(0, startIndex + startMarker.length) + '\n' + topicCards + '        </div>\n    </div>\n\n    ' + endMarker + content.substring(endIndex + endMarker.length);
  fs.writeFileSync(indexPath, newContent);
  console.log(`Fixed: ${indexPath} (${files.length} topics)`);
} else {
  console.log('Could not find markers in file');
}
