import { defineConfig, devices } from "@playwright/test";
const testPort = process.env.E2E_PORT ?? "5174";
const testUrl = `http://localhost:${testPort}`;
export default defineConfig({
  testDir: "./tests/e2e",
  fullyParallel: false,
  workers: 1,
  timeout: 60000,
  expect: { timeout: 10000 },
  reporter: "list",
  use: {
    baseURL: process.env.E2E_BASE_URL ?? testUrl,
    ...devices["Desktop Chrome"],
    channel: "chrome",
    trace: "retain-on-failure",
  },
  webServer: {
    command: `yarn next dev --hostname 127.0.0.1 --port ${testPort}`,
    url: testUrl,
    reuseExistingServer: false,
    timeout: 60000,
    env: {
      E2E_MODE: "true",
      API_INTERNAL_URL:
        process.env.E2E_API_URL ?? "http://localhost:3002/api/v1",
      NEXT_PUBLIC_API_BASE_URL: "http://localhost:3002/api/v1",
      NEXT_PUBLIC_SITE_URL: testUrl,
    },
  },
});
