const fs = require('fs');
const path = require('path');

const pagesDir = path.join(__dirname, 'client', 'src', 'app', 'pages');

const processFile = (filePath) => {
  let content = fs.readFileSync(filePath, 'utf8');
  let originalContent = content;

  // Replace Spartan imports
  content = content.replace(/import\s+\{[^}]*HlmCardDirective[^}]*\}\s+from\s+['"]@spartan-ng\/helm\/card['"];/g, 
    "import { HlmCardImports } from '@spartan-ng/helm/card';");
  
  content = content.replace(/import\s+\{\s*HlmInputDirective\s*\}\s+from\s+['"]@spartan-ng\/helm\/input['"];/g, 
    "import { HlmInput } from '@spartan-ng/helm/input';");
  
  content = content.replace(/import\s+\{\s*HlmLabelDirective\s*\}\s+from\s+['"]@spartan-ng\/helm\/label['"];/g, 
    "import { HlmLabel } from '@spartan-ng/helm/label';");

  // Fix component imports array
  content = content.replace(/HlmCardDirective(?:,\s*HlmCard[A-Za-z]+Directive)*/g, 'HlmCardImports');
  content = content.replace(/HlmInputDirective/g, 'HlmInput');
  content = content.replace(/HlmLabelDirective/g, 'HlmLabel');

  if (content !== originalContent) {
    fs.writeFileSync(filePath, content, 'utf8');
    console.log('Fixed', filePath);
  }
};

const walk = (dir) => {
  const files = fs.readdirSync(dir);
  for (const file of files) {
    const fullPath = path.join(dir, file);
    if (fs.statSync(fullPath).isDirectory()) {
      walk(fullPath);
    } else if (fullPath.endsWith('.ts')) {
      processFile(fullPath);
    }
  }
};

walk(pagesDir);
