
#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

console.log('🧹 Starting nuclear cache clear for MSW v2...');

// Directories to remove (comprehensive list)
const dirsToRemove = [
  'node_modules',
  '.vitest',
  'dist',
  'coverage',
  '.tsbuildinfo',
  '.vite',
  '.cache',
  'test-results',
  'playwright-report',
  '.nyc_output'
];

// Remove directories with better error handling
dirsToRemove.forEach(dir => {
  try {
    if (fs.existsSync(dir)) {
      console.log(`🗑️  Removing ${dir}...`);
      fs.rmSync(dir, { recursive: true, force: true });
      console.log(`✅ Removed ${dir}`);
    } else {
      console.log(`⏭️  ${dir} not found, skipping`);
    }
  } catch (error) {
    console.warn(`⚠️  Warning: Could not remove ${dir}:`, error.message);
  }
});

// Remove lock files
const lockFiles = ['package-lock.json', 'yarn.lock', 'pnpm-lock.yaml', 'bun.lockb'];
lockFiles.forEach(file => {
  try {
    if (fs.existsSync(file)) {
      console.log(`🗑️  Removing ${file}...`);
      fs.unlinkSync(file);
      console.log(`✅ Removed ${file}`);
    }
  } catch (error) {
    console.warn(`⚠️  Warning: Could not remove ${file}:`, error.message);
  }
});

// Clear npm cache with force
try {
  console.log('🧽 Clearing npm cache...');
  execSync('npm cache clean --force', { stdio: 'inherit' });
  console.log('✅ NPM cache cleared');
} catch (error) {
  console.warn('⚠️  Warning: Could not clear npm cache:', error.message);
}

// Verify MSW v2 is properly configured
console.log('🔍 Verifying MSW v2 setup...');
try {
  // Check if MSW v2 is in package.json
  const packageJson = JSON.parse(fs.readFileSync('package.json', 'utf8'));
  const mswVersion = packageJson.devDependencies?.msw || packageJson.dependencies?.msw;
  if (mswVersion) {
    console.log(`📦 MSW version in package.json: ${mswVersion}`);
    if (mswVersion.startsWith('^2') || mswVersion.startsWith('2')) {
      console.log('✅ MSW v2 configured correctly');
    } else {
      console.warn('⚠️  Warning: MSW version might not be v2');
    }
  }
} catch (error) {
  console.warn('⚠️  Could not verify MSW version:', error.message);
}

console.log('\n🎯 Nuclear cache clear complete!');
console.log('📋 Next steps:');
console.log('   1. Run: npm install');
console.log('   2. Run: npm run test:nuclear');
console.log('   3. Or run: npx vitest run --no-cache --config vitest.config.ts');
console.log('\n🚀 This should resolve any MSW v1/v2 cache conflicts!');
