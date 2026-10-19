import { defineConfig } from '@playwright/test'
const production = process.env.TEST_PREVIEW === '1'
const url = production ? 'http://127.0.0.1:4173' : 'http://127.0.0.1:5173'
export default defineConfig({
  testDir: './tests',
  timeout: 90000,
  workers: 1,
  use: { baseURL: url, channel: 'chrome', viewport: { width: 1440, height: 1080 }, launchOptions: { args: ['--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader'] } },
  webServer: { command: `npm run ${production ? 'preview' : 'dev'} -- --host 127.0.0.1 --port ${production ? '4173' : '5173'} --strictPort`, url, reuseExistingServer: true },
})
