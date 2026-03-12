import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  testDir: './tests',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 1,
  workers: process.env.CI ? 2 : undefined,

  reporter: [
    ['list'],
    ['html', { outputFolder: 'playwright-report', open: 'never' }],
    ['junit', { outputFile: 'results/junit.xml' }],
  ],

  use: {
    baseURL: 'https://www.demoblaze.com',
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
    video: 'retain-on-failure',
    actionTimeout: 10_000,
    navigationTimeout: 30_000,
  },

  projects: [
    // UI – multi-browser
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
      testMatch: 'tests/ui/**/*.spec.ts',
    },
    {
      name: 'firefox',
      use: { ...devices['Desktop Firefox'] },
      testMatch: 'tests/ui/**/*.spec.ts',
    },
    {
      name: 'webkit',
      use: { ...devices['Desktop Safari'] },
      testMatch: 'tests/ui/**/*.spec.ts',
    },
    // API – single runner (no browser needed)
    {
      name: 'api',
      use: { baseURL: 'https://petstore.swagger.io/v2' },
      testMatch: 'tests/api/**/*.spec.ts',
    },
  ],

  outputDir: 'test-results/',
});
