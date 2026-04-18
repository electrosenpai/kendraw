import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  testDir: './e2e',
  fullyParallel: false,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: 1,
  reporter: process.env.CI ? 'github' : 'list',
  timeout: 30_000,

  use: {
    baseURL: 'http://localhost:5173',
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
    video: 'retain-on-failure',
  },

  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
    // Wave-5 hotfix — runs the same suite against the new-canvas mode so
    // shell-parity tests catch any future flag-scope regression. The flag
    // is not toggled here; the dev-server is started with
    // VITE_ENABLE_NEW_CANVAS=true via the `test:e2e:new-canvas` script.
    {
      name: 'chromium-new-canvas',
      use: { ...devices['Desktop Chrome'] },
    },
  ],

  webServer: [
    {
      command: 'cd backend && uv run uvicorn kendraw_api.main:app --host 0.0.0.0 --port 8081',
      url: 'http://localhost:8081/health',
      timeout: 60_000,
      reuseExistingServer: !process.env.CI,
    },
    {
      command: 'pnpm dev --host 0.0.0.0',
      url: 'http://localhost:5173',
      timeout: 60_000,
      reuseExistingServer: !process.env.CI,
    },
  ],
});
