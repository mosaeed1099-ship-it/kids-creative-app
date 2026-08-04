// Playwright config for the Puzzle Studio spec.
// Run from the repo root:
//   npx playwright install chromium
//   npx playwright test --config js/modules/puzzle-studio/tests/playwright.config.js
import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  testDir: '.',
  timeout: 30000,
  use: { baseURL: 'http://localhost:8099', trace: 'off' },
  projects: [
    { name: 'desktop', use: { ...devices['Desktop Chrome'] } },
    { name: 'tablet', use: { ...devices['iPad (gen 7)'] } },
  ],
  webServer: {
    command: 'python3 -m http.server 8099',
    cwd: process.cwd(),
    url: 'http://localhost:8099/index.html',
    reuseExistingServer: true,
    timeout: 20000,
  },
});
