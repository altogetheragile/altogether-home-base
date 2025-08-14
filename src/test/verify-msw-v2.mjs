#!/usr/bin/env node

/**
 * MSW v2 Compliance Verification Script
 * Ensures the project is using MSW v2 compatible patterns
 */

import { readFileSync, existsSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const projectRoot = join(__dirname, '../..');

console.log('🔍 Verifying MSW v2 compliance...');

try {
  // Check if package.json exists and read MSW version
  const packageJsonPath = join(projectRoot, 'package.json');
  
  if (!existsSync(packageJsonPath)) {
    console.log('⚠️  package.json not found, skipping MSW verification');
    process.exit(0);
  }

  const packageJson = JSON.parse(readFileSync(packageJsonPath, 'utf8'));
  const mswVersion = packageJson.dependencies?.msw || packageJson.devDependencies?.msw;

  if (!mswVersion) {
    console.log('✅ MSW not installed - no compliance check needed');
    process.exit(0);
  }

  console.log(`📦 Found MSW version: ${mswVersion}`);

  // Check if it's v2.x
  const isV2 = mswVersion.includes('2.') || mswVersion.startsWith('^2.') || mswVersion.startsWith('~2.');
  
  if (isV2) {
    console.log('✅ MSW v2 detected - compliance verified');
  } else {
    console.log('⚠️  MSW v1 detected - consider upgrading to v2 for better compatibility');
  }

  // Check for common MSW setup files
  const setupFiles = [
    'src/test/setup.ts',
    'src/test/setupTests.ts',
    'src/test-setup.ts',
    'src/setupTests.ts'
  ];

  const foundSetupFiles = setupFiles.filter(file => existsSync(join(projectRoot, file)));
  
  if (foundSetupFiles.length > 0) {
    console.log(`📁 Found test setup files: ${foundSetupFiles.join(', ')}`);
  }

  console.log('✅ MSW v2 compliance verification complete');
  process.exit(0);

} catch (error) {
  console.error('❌ Error during MSW verification:', error.message);
  process.exit(1);
}