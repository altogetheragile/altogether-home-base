#!/usr/bin/env node

/**
 * BDD Test Runner Script
 * 
 * This script provides an easy way to run BDD tests with different options.
 * Usage: node run-bdd-tests.js [options]
 */

const { spawn } = require('child_process');
const path = require('path');

// Parse command line arguments
const args = process.argv.slice(2);
const options = {
  tags: null,
  headless: process.env.CI === 'true',
  parallel: false,
  format: 'progress',
  watch: false
};

// Parse arguments
for (let i = 0; i < args.length; i++) {
  const arg = args[i];
  switch (arg) {
    case '--tags':
      options.tags = args[++i];
      break;
    case '--headless':
      options.headless = true;
      break;
    case '--headed':
      options.headless = false;
      break;
    case '--parallel':
      options.parallel = true;
      break;
    case '--watch':
      options.watch = true;
      break;
    case '--format':
      options.format = args[++i];
      break;
    case '--help':
      printHelp();
      process.exit(0);
  }
}

function printHelp() {
  console.log(`
🥒 BDD Test Runner for Knowledge Base Admin

Usage: node run-bdd-tests.js [options]

Options:
  --tags <tag>      Run tests with specific tag (e.g., @smoke, @analytics)
  --headless        Run in headless mode (default in CI)
  --headed          Run with visible browser
  --parallel        Run tests in parallel
  --watch           Watch for changes and rerun tests
  --format <fmt>    Output format (progress, json, html)
  --help            Show this help

Examples:
  node run-bdd-tests.js                    # Run all tests
  node run-bdd-tests.js --tags @smoke      # Run smoke tests only
  node run-bdd-tests.js --headed --watch   # Development mode
  node run-bdd-tests.js --parallel         # Fast execution
`);
}

function checkDependencies() {
  console.log('🔍 Checking project dependencies...');
  
  try {
    const fs = require('fs');
    const packageJson = JSON.parse(fs.readFileSync('package.json', 'utf8'));
    const hasCucumber = packageJson.dependencies?.['@cucumber/cucumber'] || packageJson.devDependencies?.['@cucumber/cucumber'];
    const hasPlaywright = packageJson.dependencies?.['playwright'] || packageJson.devDependencies?.['@playwright/test'];
    
    if (!hasCucumber || !hasPlaywright) {
      console.log('❌ Missing required dependencies. Please run:');
      console.log('   npm install');
      console.log('   npx playwright install chromium');
      process.exit(1);
    }
    
    console.log('✅ Dependencies check passed');
  } catch (error) {
    console.log('⚠️  Could not verify dependencies, but continuing...');
  }
}

function runBDDTests() {
  console.log('🥒 Starting BDD Tests for Knowledge Base Admin');
  console.log(`📊 Configuration: ${JSON.stringify(options, null, 2)}`);

  // Build cucumber command
  const cucumberCmd = ['npx', '@cucumber/cucumber'];
  const cucumberArgs = ['--config', 'cucumber.config.cjs'];

  // Add options
  if (options.tags) {
    cucumberArgs.push('--tags', options.tags);
  }

  if (options.parallel) {
    cucumberArgs.push('--parallel', '2');
  }

  if (options.watch) {
    cucumberArgs.push('--watch');
  }

  if (options.format !== 'progress') {
    switch (options.format) {
      case 'json':
        cucumberArgs.push('--format', 'json:reports/cucumber-report.json');
        break;
      case 'html':
        cucumberArgs.push('--format', 'html:reports/cucumber-report.html');
        break;
    }
  }

  // Set environment variables
  const env = { 
    ...process.env,
    HEADLESS: options.headless.toString()
  };

  console.log(`🚀 Running: ${cucumberCmd.join(' ')} ${cucumberArgs.join(' ')}`);

  // Spawn the cucumber process
  const cucumber = spawn(cucumberCmd[1], cucumberArgs, {
    stdio: 'inherit',
    env: env,
    cwd: process.cwd()
  });

  cucumber.on('close', (code) => {
    if (code === 0) {
      console.log('✅ BDD tests completed successfully!');
      if (options.format === 'html') {
        console.log('📊 HTML report generated at: reports/cucumber-report.html');
      }
    } else {
      console.log(`❌ BDD tests failed with exit code ${code}`);
      console.log('📸 Check screenshots/ directory for failure captures');
    }
    process.exit(code);
  });

  cucumber.on('error', (err) => {
    console.error('❌ Failed to start BDD tests:', err);
    process.exit(1);
  });
}

// Check if required directories exist
const fs = require('fs');
const requiredDirs = ['features', 'steps', 'support', 'reports'];

console.log('🔍 Checking BDD test environment...');

// Check dependencies first
checkDependencies();

for (const dir of requiredDirs) {
  if (!fs.existsSync(dir)) {
    console.log(`📁 Creating missing directory: ${dir}/`);
    fs.mkdirSync(dir, { recursive: true });
  }
}

// Ensure reports directory exists
if (!fs.existsSync('reports')) {
  fs.mkdirSync('reports', { recursive: true });
}

console.log('✅ Environment setup complete');

// Start the tests
runBDDTests();