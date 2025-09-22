import { BeforeAll, AfterAll, Before, After, Status } from '@cucumber/cucumber';
import { World } from './world';

BeforeAll(async function () {
  console.log('🚀 Starting BDD test suite...');
});

AfterAll(async function () {
  console.log('✅ BDD test suite completed');
});

Before(async function (this: World) {
  await this.init();
  console.log(`🎬 Starting scenario: ${this.pickle?.name}`);
});

After(async function (this: World, scenario) {
  if (scenario.result?.status === Status.FAILED) {
    console.log(`❌ Scenario failed: ${this.pickle?.name}`);
    
    // Take screenshot on failure
    if (this.page) {
      const screenshot = await this.page.screenshot({ 
        path: `screenshots/failed-${Date.now()}.png`,
        fullPage: true 
      });
      this.attach(screenshot, 'image/png');
    }
  } else {
    console.log(`✅ Scenario passed: ${this.pickle?.name}`);
  }
  
  await this.cleanup();
});

// Tag-specific hooks
Before({ tags: '@smoke' }, async function () {
  console.log('🏃‍♂️ Running smoke test');
});

Before({ tags: '@bulk-operations' }, async function () {
  console.log('🔄 Running bulk operations test');
  // Set up multiple test items if needed
});

Before({ tags: '@analytics' }, async function () {
  console.log('📊 Running analytics test');
  // Set up analytics test data if needed
});