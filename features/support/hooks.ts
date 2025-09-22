import { Before, After, BeforeAll, AfterAll, Status } from '@cucumber/cucumber';
import { CustomWorld } from './world';
import { mkdir } from 'fs/promises';
import { existsSync } from 'fs';

BeforeAll(async function () {
  // Create screenshots directory if it doesn't exist
  if (!existsSync('screenshots')) {
    await mkdir('screenshots', { recursive: true });
  }
  
  // Create cucumber reports directory
  if (!existsSync('cucumber-reports')) {
    await mkdir('cucumber-reports', { recursive: true });
  }
});

Before(async function (this: CustomWorld) {
  // Open browser before each scenario
  await this.openBrowser();
});

After(async function (this: CustomWorld, scenario) {
  // Take screenshot on failure
  if (scenario.result?.status === Status.FAILED) {
    const scenarioName = scenario.pickle.name.replace(/[^a-zA-Z0-9]/g, '_');
    await this.takeScreenshot(`failed_${scenarioName}`);
  }
  
  // Close browser after each scenario
  await this.closeBrowser();
});

AfterAll(async function () {
  // Any global cleanup can go here
  console.log('All scenarios completed');
});