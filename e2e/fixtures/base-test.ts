/**
 * Extended Playwright test with auto console/network monitoring.
 * Use this instead of @playwright/test in all spec files.
 *
 * @feature Global test infrastructure
 * @priority P0
 */

import { test as base, expect } from '@playwright/test';

type ConsoleCollector = string[];

export const test = base.extend<{
  consoleErrors: ConsoleCollector;
  networkFailures: ConsoleCollector;
}>({
  consoleErrors: [
    async ({ page }, use) => {
      const errors: string[] = [];
      page.on('console', (msg) => {
        if (msg.type() !== 'error') return;
        const text = msg.text();
        // Filter known non-critical noise
        if (text.includes('React DevTools')) return;
        if (text.includes('Download the React DevTools')) return;
        if (text.includes('favicon')) return;
        if (text.includes('404')) return;
        if (text.includes('Failed to load resource')) return;
        errors.push(text);
      });
      page.on('pageerror', (err) => {
        errors.push(`PageError: ${err.message}`);
      });
      await use(errors);
    },
    { auto: true },
  ],

  networkFailures: [
    async ({ page }, use) => {
      const failures: string[] = [];
      page.on('requestfailed', (req) => {
        const url = req.url();
        if (url.includes('favicon') || url.includes('.map')) return;
        failures.push(`${req.method()} ${url} — ${req.failure()?.errorText}`);
      });
      await use(failures);
    },
    { auto: true },
  ],
});

export { expect };
