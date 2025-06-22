
#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

console.log('🧹 Starting comprehensive cache clear...');

// Directories to remove
const dirsToRemove = [
  'node_modules',
  '.vitest',
  'dist',
  'coverage',
  '.tsbuildinfo',
  '.vite',
  '.cache'
];

// Remove directories
dirsToRemove.forEach(dir => {
  try {
    if (fs.existsSync(dir)) {
      console.log(`Removing ${dir}...`);
      fs.rmSync(dir, { recursive: true, force: true });
    }
  } catch (error) {
    console.warn(`Warning: Could not remove ${dir}:`, error.message);
  }
});

// Remove lock files
const lockFiles = ['package-lock.json', 'yarn.lock', 'pnpm-lock.yaml'];
lockFiles.forEach(file => {
  try {
    if (fs.existsSync(file)) {
      console.log(`Removing ${file}...`);
      fs.unlinkSync(file);
    }
  } catch (error) {
    console.warn(`Warning: Could not remove ${file}:`, error.message);
  }
});

// Clear npm cache
try {
  console.log('Clearing npm cache...');
  execSync('npm cache clean --force', { stdio: 'inherit' });
} catch (error) {
  console.warn('Warning: Could not clear npm cache:', error.message);
}

console.log('✅ Cache clear complete!');
console.log('Now run: npm install && npm run test:run');
