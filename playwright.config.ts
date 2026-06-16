import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  testDir: './e2e',
  timeout: 60_000,
  outputDir: './test-results',
  use: {
    baseURL: 'http://localhost:4200',
    trace: 'on-first-retry',
    viewport: { width: 1440, height: 810 },
    // Graba video de cada test (sirve para la demo).
    video: { mode: 'on', size: { width: 1440, height: 810 } },
  },
  webServer: {
    command: 'npm start',
    url: 'http://localhost:4200',
    reuseExistingServer: !process.env['CI'],
    timeout: 120_000,
  },
  projects: [
    { name: 'e2e', testIgnore: /(demo|hero)\.spec\.ts/, use: { ...devices['Desktop Chrome'] } },
    { name: 'hero', testMatch: /hero\.spec\.ts/, use: { ...devices['Desktop Chrome'] }, timeout: 90_000 },
    { name: 'demo', testMatch: /demo\.spec\.ts/, use: { ...devices['Desktop Chrome'] }, timeout: 180_000 },
  ],
});
