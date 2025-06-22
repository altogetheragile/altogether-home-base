#!/usr/bin/env node

import { readFileSync, readdirSync, statSync, existsSync } from 'fs';
import { join } from 'path';
import { execSync } from 'child_process';

console.log('🔍 Comprehensive MSW v2 compliance check...');

const issues = [];
const checkedFiles = [];

function checkFile(filePath) {
  try {
    const content = readFileSync(filePath, 'utf8');
    const lines = content.split('\n');
    checkedFiles.push(filePath);
    
    lines.forEach((line, index) => {
      const lineNum = index + 1;
      const trimmedLine = line.trim();
      
      // Skip comments and empty lines
      if (trimmedLine.startsWith('//') || trimmedLine.startsWith('*') || !trimmedLine) {
        return;
      }
      
      // Check for old MSW v1 patterns (more comprehensive)
      if (line.includes('rest.')) {
        // Check if it's actually a method call, not just a string or comment
        if (/rest\.(get|post|put|patch|delete|head|options)/.test(line)) {
          issues.push({
            file: filePath,
            line: lineNum,
            issue: '❌ Uses old MSW v1 rest API',
            content: trimmedLine,
            severity: 'error'
          });
        }
      }
      
      // Check for old MSW v1 imports
      if (line.includes('import') && line.includes('rest') && line.includes('msw')) {
        issues.push({
          file: filePath,
          line: lineNum,
          issue: '❌ Imports old MSW v1 rest',
          content: trimmedLine,
          severity: 'error'
        });
      }
      
      // Check for missing MSW v2 imports when using http
      if (line.includes('http.') && !content.includes('import { http')) {
        issues.push({
          file: filePath,
          line: lineNum,
          issue: '⚠️  Uses http but missing MSW v2 import',
          content: trimmedLine,
          severity: 'warning'
        });
      }
      
      // Check for old response patterns
      if (line.includes('res(') || line.includes('res.json')) {
        issues.push({
          file: filePath,
          line: lineNum,
          issue: '⚠️  Uses old MSW v1 response pattern',
          content: trimmedLine,
          severity: 'warning'
        });
      }
    });
  } catch (error) {
    console.warn(`⚠️  Could not check file ${filePath}:`, error.message);
  }
}

function walkDir(dir, maxDepth = 3, currentDepth = 0) {
  if (currentDepth > maxDepth) return;
  
  try {
    const files = readdirSync(dir);
    
    files.forEach(file => {
      const filePath = join(dir, file);
      const stat = statSync(filePath);
      
      if (stat.isDirectory() && !file.startsWith('.') && file !== 'node_modules') {
        walkDir(filePath, maxDepth, currentDepth + 1);
      } else if (file.endsWith('.ts') || file.endsWith('.tsx')) {
        checkFile(filePath);
      }
    });
  } catch (error) {
    console.warn(`⚠️  Could not read directory ${dir}:`, error.message);
  }
}

// Check test directory and src directory
walkDir('./src/test');
walkDir('./src', 2); // Limited depth for src to avoid too many files

console.log(`\n📊 Checked ${checkedFiles.length} files`);

const errors = issues.filter(i => i.severity === 'error');
const warnings = issues.filter(i => i.severity === 'warning');

if (errors.length === 0 && warnings.length === 0) {
  console.log('✅ All files are MSW v2 compliant!');
  console.log('🎉 No MSW v1 patterns found');
} else {
  if (errors.length > 0) {
    console.log(`\n❌ Found ${errors.length} MSW v1 error(s):`);
    errors.forEach(issue => {
      console.log(`   ${issue.file}:${issue.line}`);
      console.log(`   ${issue.issue}`);
      console.log(`   Code: ${issue.content}`);
      console.log('');
    });
  }
  
  if (warnings.length > 0) {
    console.log(`\n⚠️  Found ${warnings.length} potential issue(s):`);
    warnings.forEach(issue => {
      console.log(`   ${issue.file}:${issue.line}`);
      console.log(`   ${issue.issue}`);
      console.log(`   Code: ${issue.content}`);
      console.log('');
    });
  }
  
  if (errors.length > 0) {
    console.log('🔧 Fix required: Update MSW v1 patterns to MSW v2');
    console.log('   Replace: rest.get/post/etc → http.get/post/etc');
    console.log('   Replace: import { rest } → import { http, HttpResponse }');
    process.exit(1);
  }
}

console.log('\n🎯 MSW v2 verification complete!');
