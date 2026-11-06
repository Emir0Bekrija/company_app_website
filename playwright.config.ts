import { defineConfig, devices } from '@playwright/test'

export default defineConfig({
  testDir: './e2e',
  timeout: 60_000,
  reporter: [['list']],
  use: { baseURL: 'http://localhost:3100', ...devices['Desktop Chrome'] },
  webServer: { command: 'npx next start -p 3100', url: 'http://localhost:3100', reuseExistingServer: false, timeout: 60_000 },
})
