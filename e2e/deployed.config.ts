import { defineConfig, devices } from '@playwright/test';
import { readFileSync } from 'node:fs';

// Load .env.e2e (gitignored) into process.env without a shell-sourcing step,
// so passwords with shell-special characters survive intact.
try {
  for (const line of readFileSync(new URL('../.env.e2e', import.meta.url), 'utf8').split('\n')) {
    const t = line.trim();
    if (!t || t.startsWith('#')) continue;
    const i = t.indexOf('=');
    if (i === -1) continue;
    const k = t.slice(0, i).trim();
    const v = t.slice(i + 1).trim().replace(/^["']|["']$/g, '');
    if (!process.env[k]) process.env[k] = v;
  }
} catch { /* file optional */ }

// Tests the live production deploy. No webServer, no local build.
export default defineConfig({
  testDir: '.',
  testMatch: '**/*.deployed.spec.ts',
  fullyParallel: false,
  workers: 1,
  retries: 0,
  reporter: [['list']],
  timeout: 90_000,
  expect: { timeout: 15_000 },
  use: {
    baseURL: process.env.E2E_BASE_URL || 'https://altogetheragile.com',
    trace: 'retain-on-failure',
    screenshot: 'only-on-failure',
    actionTimeout: 15_000,
    navigationTimeout: 30_000,
  },
  projects: [{ name: 'chromium', use: { ...devices['Desktop Chrome'] } }],
});
