import { defineConfig } from '@playwright/test';
export default defineConfig({
  testDir: './tests', fullyParallel: false, workers: 1, timeout: 45000,
  use: { baseURL: 'http://127.0.0.1:3000', browserName: 'chromium', channel: 'msedge', screenshot: 'only-on-failure', trace: 'retain-on-failure' },
  webServer: { command: 'npm run dev', url: 'http://127.0.0.1:3000', reuseExistingServer: process.env.TONY_AUTH_TEST!=='true', timeout: 120000, env: {NEXT_PUBLIC_TONY_API_BASE: process.env.TONY_AUTH_TEST==='true'?'http://127.0.0.1:8931':'http://127.0.0.1:3000/pedido-api',NEXT_PUBLIC_TONY_AUTH_ENABLED:process.env.TONY_AUTH_TEST==='true'?'true':'false'} },
});
