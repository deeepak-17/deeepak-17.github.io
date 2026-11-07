import { defineConfig, devices } from "@playwright/test";

export default defineConfig({
  testDir: "tests/e2e",
  testMatch: "*.spec.mjs",
  fullyParallel: true,
  workers: "50%",
  reporter: [["list"]],
  use: { baseURL: "http://127.0.0.1:8100" },
  webServer: {
    command: "python3 scripts/serve.py 8100",
    url: "http://127.0.0.1:8100",
    reuseExistingServer: false,
  },
  projects: [
    { name: "chromium", use: { ...devices["Desktop Chrome"] }, testIgnore: "clasp-smooth.spec.mjs" },
    { name: "webkit", use: { ...devices["Desktop Safari"] }, testIgnore: "clasp-smooth.spec.mjs" },
    // Frame-timing test: runs alone, after everything else, so other browsers don't steal its CPU.
    { name: "perf-chromium", use: { ...devices["Desktop Chrome"] }, testMatch: "clasp-smooth.spec.mjs", dependencies: ["chromium", "webkit"] },
    { name: "perf-webkit", use: { ...devices["Desktop Safari"] }, testMatch: "clasp-smooth.spec.mjs", dependencies: ["perf-chromium"] },
  ],
});
