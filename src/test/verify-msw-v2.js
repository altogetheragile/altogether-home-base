
#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

console.log('🔍 Verifying MSW v2 compliance...');

const testDir = path.join(__dirname);
const issues = [];

function checkFile(filePath) {
  try {
    const content = fs.readFileSync(filePath, 'utf8');
    const lines = content.split('\n');
    
    lines.forEach((line, index) => {
      // Check for old MSW v1 patterns
      if (line.includes('rest.') && !line.includes('//')) {
        issues.push({
          file: filePath,
          line: index + 1,
          issue: 'Uses old MSW v1 rest API',
          content: line.trim()
        });
      }
      
      if (line.includes('import') && line.includes('rest') && line.includes('msw')) {
        issues.push({
          file: filePath,
          line: index + 1,
          issue: 'Imports old MSW v1 rest',
          content: line.trim()
        });
      }
      
      // Check for proper MSW v2 imports
      if (line.includes('import') && line.includes('msw') && !line.includes('http')) {
        issues.push({
          file: filePath,
          line: index + 1,
          issue: 'Missing http import for MSW v2',
          content: line.trim()
        });
      }
    });
  } catch (error) {
    console.warn(`Could not check file ${filePath}:`, error.message);
  }
}

function walkDir(dir) {
  const files = fs.readdirSync(dir);
  
  files.forEach(file => {
    const filePath = path.join(dir, file);
    const stat = fs.statSync(filePath);
    
    if (stat.isDirectory()) {
      walkDir(filePath);
    } else if (file.endsWith('.ts') || file.endsWith('.tsx')) {
      checkFile(filePath);
    }
  });
}

walkDir(testDir);

if (issues.length === 0) {
  console.log('✅ All files are MSW v2 compliant!');
} else {
  console.log('❌ Found MSW v1 patterns:');
  issues.forEach(issue => {
    console.log(`  ${issue.file}:${issue.line} - ${issue.issue}`);
    console.log(`    ${issue.content}`);
  });
  process.exit(1);
}
