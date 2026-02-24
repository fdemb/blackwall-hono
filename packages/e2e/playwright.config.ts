import { defineConfig, devices } from "@playwright/test";
import { mkdirSync } from "node:fs";
import path from "node:path";
import { DB_PATH, UPLOADS_PATH } from "./paths.ts";

mkdirSync(path.dirname(DB_PATH), { recursive: true });

const APP_BASE_URL = process.env.APP_BASE_URL ?? "http://localhost:3000";
const VITE_BACKEND_URL = process.env.VITE_BACKEND_URL ?? "http://localhost:8000";
const APP_SECRET = process.env.APP_SECRET ?? "e2e-test-secret";
const ARGON2_MEMORY_COST = process.env.ARGON2_MEMORY_COST ?? "8192";
const ARGON2_TIME_COST = process.env.ARGON2_TIME_COST ?? "1";

export default defineConfig({
  testDir: "./tests",
  fullyParallel: false,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: 1,
  timeout: 5_000,
  reporter: [["html"], ["list"], ["json", { outputFile: "test-results/results.json" }]],
  globalSetup: "./global-setup.ts",
  globalTeardown: "./global-teardown.ts",
  use: {
    baseURL: APP_BASE_URL,
    trace: "on-first-retry",
    screenshot: "only-on-failure",
  },
  projects: [{ name: "chromium", use: { ...devices["Desktop Chrome"] } }],
  webServer: [
    {
      command: "bun --no-env run --hot src/index.ts",
      cwd: "../../packages/backend",
      url: `${VITE_BACKEND_URL}/api/docs`,
      reuseExistingServer: !process.env.CI,
      env: {
        ...process.env,
        NODE_ENV: "test",
        DATABASE_URL: DB_PATH,
        FILES_DIR: UPLOADS_PATH,
        APP_SECRET,
        APP_BASE_URL,
        ARGON2_MEMORY_COST,
        ARGON2_TIME_COST,
      },
    },
    {
      command: "bun --no-env run --bun vite dev --port 3000",
      cwd: "../../packages/frontend",
      url: APP_BASE_URL,
      reuseExistingServer: !process.env.CI,
      env: {
        ...process.env,
        VITE_BACKEND_URL,
      },
    },
  ],
});
