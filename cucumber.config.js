const { defineConfig } = require('@cucumber/cucumber');

module.exports = defineConfig({
  // Feature files
  features: './features/**/*.feature',
  
  // Step definitions
  glue: ['./steps/**/*.ts', './features/support/**/*.ts'],
  
  // Require TypeScript compilation
  requireModule: ['tsx/cjs'],
  
  // Format options
  format: [
    'pretty',
    'html:cucumber-report.html',
    'json:cucumber-report.json'
  ],
  
  // Parallel execution
  parallel: 2,
  
  // Tags for filtering scenarios
  tags: process.env.CUCUMBER_TAGS || 'not @skip',
  
  // World parameters
  worldParameters: {
    baseURL: process.env.BASE_URL || 'http://localhost:5173',
    headless: process.env.HEADLESS !== 'false',
    slowMo: process.env.SLOW_MO ? parseInt(process.env.SLOW_MO) : 0,
    timeout: process.env.TIMEOUT ? parseInt(process.env.TIMEOUT) : 30000,
  },
  
  // Retry failed scenarios
  retry: process.env.CI ? 1 : 0,
  
  // Exit on first failure in CI
  failFast: !!process.env.CI,
  
  // Publish results
  publish: false,
  
  // Dry run option
  dryRun: process.env.DRY_RUN === 'true',
});