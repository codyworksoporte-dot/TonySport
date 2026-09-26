import {defineConfig} from '@playwright/test';
export default defineConfig({testDir: '.', testMatch: ['pricing.spec.ts','downloads.spec.ts'], workers: 1, reporter: 'list', use: {browserName:'chromium',channel:'msedge'}});
