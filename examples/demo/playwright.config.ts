import { createServer } from 'node:net';
import { defineConfig, devices } from '@playwright/test';

async function findFreePort(): Promise<number> {
  return new Promise((resolve, reject) => {
    const server = createServer();
    server.once('error', reject);
    server.listen(0, () => {
      const address = server.address();
      const port = typeof address === 'object' && address ? address.port : 0;
      server.close(() => {
        resolve(port);
      });
    });
  });
}

// Pick the port once. Playwright reloads this config in every worker, and
// workers inherit the environment of the main process, so they reuse it.
// Set PLAYWRIGHT_PORT to choose a port yourself.
process.env.PLAYWRIGHT_PORT ??= String(await findFreePort());

const PORT = Number(process.env.PLAYWRIGHT_PORT);
const BASE_URL = `http://localhost:${PORT}`;

export default defineConfig({
  testDir: './e2e',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  reporter: 'list',
  use: {
    baseURL: BASE_URL,
    trace: 'on-first-retry',
  },
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
  ],
  webServer: {
    command: `vite --port ${PORT} --strictPort`,
    url: BASE_URL,
    // Never reuse a server that Playwright did not start.
    reuseExistingServer: false,
  },
});
