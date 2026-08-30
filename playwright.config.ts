import { defineConfig, devices } from "@playwright/test";
import { getSiteUrl } from "./lib/site-url";

const baseURL = getSiteUrl();

export default defineConfig({
  testDir: "./tests/e2e",
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 2 : 1,
  reporter: "html",
  use: {
    baseURL,
    trace: "on-first-retry",
  },
  projects: [
    {
      name: "chromium-en-light",
      use: { ...devices["Desktop Chrome"], locale: "en-US", colorScheme: "light" },
    },
    {
      name: "chromium-en-dark",
      use: { ...devices["Desktop Chrome"], locale: "en-US", colorScheme: "dark" },
    },
  ],
  webServer: {
    command: "npm run start",
    url: baseURL,
    reuseExistingServer: true,
    timeout: 120000,
  },
});
