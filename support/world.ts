import { setWorldConstructor, IWorldOptions } from '@cucumber/cucumber';
import { Browser, BrowserContext, Page, chromium } from '@playwright/test';

export interface ICustomWorld {
  browser?: Browser;
  context?: BrowserContext;
  page?: Page;
}

export class World implements ICustomWorld {
  browser?: Browser;
  context?: BrowserContext;
  page?: Page;

  constructor(options: IWorldOptions) {
    // Initialize the world
  }

  async init() {
    this.browser = await chromium.launch({
      headless: process.env.CI === 'true' || process.env.HEADLESS === 'true'
    });
    this.context = await this.browser.newContext({
      viewport: { width: 1280, height: 720 }
    });
    this.page = await this.context.newPage();

    // Set up console and error logging
    this.page.on('console', msg => {
      if (msg.type() === 'error') {
        console.log(`Browser console error: ${msg.text()}`);
      }
    });

    this.page.on('pageerror', err => {
      console.log(`Page error: ${err.message}`);
    });
  }

  async cleanup() {
    if (this.page) {
      await this.page.close();
    }
    if (this.context) {
      await this.context.close();
    }
    if (this.browser) {
      await this.browser.close();
    }
  }
}

setWorldConstructor(World);