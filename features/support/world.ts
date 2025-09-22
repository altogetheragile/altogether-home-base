import { setWorldConstructor, World, IWorldOptions } from '@cucumber/cucumber';
import { Browser, BrowserContext, Page, chromium, firefox, webkit } from '@playwright/test';

export interface CucumberWorldConstructorParams {
  parameters: {
    baseURL: string;
    headless: boolean;
    slowMo: number;
    timeout: number;
  };
}

export class CustomWorld extends World {
  public browser!: Browser;
  public context!: BrowserContext;
  public page!: Page;
  public baseURL: string;
  public headless: boolean;
  public slowMo: number;
  public timeout: number;

  constructor(options: IWorldOptions<CucumberWorldConstructorParams>) {
    super(options);
    this.baseURL = options.parameters?.baseURL || 'http://localhost:5173';
    this.headless = options.parameters?.headless ?? true;
    this.slowMo = options.parameters?.slowMo || 0;
    this.timeout = options.parameters?.timeout || 30000;
  }

  async openBrowser(browserType: 'chromium' | 'firefox' | 'webkit' = 'chromium') {
    const browsers = { chromium, firefox, webkit };
    this.browser = await browsers[browserType].launch({
      headless: this.headless,
      slowMo: this.slowMo,
    });
    
    this.context = await this.browser.newContext({
      viewport: { width: 1280, height: 720 },
      baseURL: this.baseURL,
    });
    
    this.page = await this.context.newPage();
    this.page.setDefaultTimeout(this.timeout);
  }

  async closeBrowser() {
    if (this.page) await this.page.close();
    if (this.context) await this.context.close();
    if (this.browser) await this.browser.close();
  }

  async takeScreenshot(name: string) {
    if (this.page) {
      const screenshot = await this.page.screenshot({ 
        fullPage: true,
        path: `screenshots/${name}-${Date.now()}.png`
      });
      return screenshot;
    }
  }
}

setWorldConstructor(CustomWorld);