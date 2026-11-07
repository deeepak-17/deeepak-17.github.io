import { defineConfig, devices } from "@playwright/test";

export default defineConfig({
  testDir: "tests/e2e",
  testMatch: "*.spec.mjs",
  fullyParallel: true,
  workers: "50%", // the smoothness test measures frame timing; saturating every core makes it flaky
  reporter: [["list"]],
  use: { baseURL: "http://127.0.0.1:8100" },
  webServer: {
    command: "python3 scripts/serve.py 8100",
    url: "http://127.0.0.1:8100",
    reuseExistingServer: false,
  },
  projects: [
    { name: "chromium", use: { ...devices["Desktop Chrome"] } },
    { name: "webkit", use: { ...devices["Desktop Safari"] } },
  ],
});
