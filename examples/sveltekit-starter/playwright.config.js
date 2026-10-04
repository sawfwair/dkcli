import { defineConfig } from '@playwright/test';

export default defineConfig({
  testDir: './tests',
  fullyParallel: false,
  workers: 1,
  use: { baseURL: 'http://127.0.0.1:4186', browserName: 'chromium' },
  webServer: { command: 'HOST=127.0.0.1 PORT=4186 ORIGIN=http://127.0.0.1:4186 node build', url: 'http://127.0.0.1:4186', reuseExistingServer: false, timeout: 30000 }
});
