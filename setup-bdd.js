#!/usr/bin/env node

/**
 * BDD Setup Script
 * Ensures all necessary directories and dependencies are ready for BDD testing
 */

const fs = require('fs');
const { execSync } = require('child_process');

console.log('🥒 Setting up BDD test environment...');

// Create required directories
const requiredDirs = ['features', 'steps', 'support', 'reports', 'screenshots', 'e2e'];

for (const dir of requiredDirs) {
  if (!fs.existsSync(dir)) {
    console.log(`📁 Creating directory: ${dir}/`);
    fs.mkdirSync(dir, { recursive: true });
  }
}

// Ensure Playwright browsers are installed
try {
  console.log('🎭 Installing Playwright browsers...');
  execSync('npx playwright install chromium', { stdio: 'inherit' });
  console.log('✅ Playwright browsers installed successfully');
} catch (error) {
  console.log('⚠️  Playwright browser installation failed, but continuing...');
}

console.log('✅ BDD environment setup complete!');
console.log('🚀 You can now run BDD tests with:');
console.log('   node run-bdd-tests.js --headed --watch');
console.log('   node run-bdd-tests.js --tags @smoke');
console.log('   node run-bdd-tests.js --parallel');