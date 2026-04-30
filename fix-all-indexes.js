const fs = require('fs');
const path = require('path');

const baseDir = 'C:\\Users\\siva\\Desktop\\jtgroupofinstitution\\public\\courses\\tamil';

const filesToFix = [
  { dir: path.join(baseDir, 'database'), icon: 'fas fa-database' },
  { dir: path.join(baseDir, 'full stack development'), icon: 'fas fa-layer-group' },
  { dir: path.join(baseDir, 'programming-languages'), icon: 'fas fa-code' },
  { dir: path.join(baseDir, 'WEB_DEVELOPMENT'), icon: 'fas fa-globe' },
  { dir: baseDir, icon: 'fas fa-book' },
];

filesToFix.forEach(({ dir, icon }) => {
  const indexPath = path.join(dir, 'index.html');
  if (!fs.existsSync(indexPath)) {
    console.log(`File not found: ${indexPath}`);
    return;
  }
  
  const content = fs.readFileSync(indexPath, 'utf8');
  
  // Get all HTML files in directory
  const files = fs.readdirSync(dir)
    .filter(f => f.endsWith('.html') && 
      f !== 'index.html' && 
      !f.toLowerCase().includes('easy') &&
      !f.toLowerCase().includes('certificate') &&
      !f.toLowerCase().includes('answer') &&
      !f.toLowerCase().includes('key'))
    .sort();
  
  if (files.length === 0) {
    console.log(`No HTML files found in ${dir}`);
    return;
  }
  
  // Generate topic cards
  let topicCards = '';
  files.forEach((file, idx) => {
    const title = file.replace('.html', '');
    const isFirst = idx === 0;
    const extraStyle = isFirst ? ' style="border-top: 5px solid #e74c3c;"' : '';
    
    topicCards += `            <div class="topic-card"${extraStyle}>\n`;
    topicCards += `                <div class="topic-icon">\n`;
    topicCards += `                    <i class="${icon}"></i>\n`;
    topicCards += `                </div>\n`;
    topicCards += `                <h3>${title}</h3>\n`;
    topicCards += `                <p>Learn ${title}</p>\n`;
    topicCards += `                <a href="${file}">Start Learning <i class="fas fa-arrow-right"></i></a>\n`;
    topicCards += `            </div>\n`;
  });
  
  // Find topics-grid div and replace content
  const topicsGridMatch = content.match(/(<div class="topics-grid">)([\s\S]*?)(<\/div>\s*<\/div>\s*<\/section>|<\/div>\s*<!-- Footer)/);
  
  if (topicsGridMatch) {
    const before = content.substring(0, topicsGridMatch.index + topicsGridMatch[1].length);
    const after = content.substring(topicsGridMatch.index + topicsGridMatch[0].length);
    
    const newContent = before + '\n' + topicCards + '        </div>\n    </div>\n' + after;
    fs.writeFileSync(indexPath, newContent);
    console.log(`Fixed: ${indexPath} (${files.length} topics)`);
  } else {
    console.log(`Could not find topics-grid in ${indexPath}`);
  }
});
