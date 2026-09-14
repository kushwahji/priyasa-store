import { defineConfig, devices } from '@playwright/test';

// The browser tests mock the Store BFF for authenticated mutations. Server-rendered
// catalog pages still need a deterministic Core upstream, so local/CI E2E starts
// a tiny contract fixture instead of depending on production data.
process.env.PRIYASA_API_BASE_URL = process.env.PRIYASA_API_BASE_URL || 'http://127.0.0.1:8787/api/v1';

export default defineConfig({
  testDir: './tests/e2e',
  timeout: 30000,
  use: { baseURL: process.env.PLAYWRIGHT_BASE_URL || 'http://127.0.0.1:3000', trace: 'retain-on-failure' },
  webServer: [
    { command: 'node tests/e2e/mock-core.mjs', url: 'http://127.0.0.1:8787/health', reuseExistingServer: !process.env.CI },
    { command: 'npm run dev', url: 'http://127.0.0.1:3000', reuseExistingServer: !process.env.CI },
  ],
  projects: [
    { name: 'chromium', use: { ...devices['Desktop Chrome'] } },
    { name: 'mobile', use: { ...devices['Pixel 7'] } },
  ],
});
