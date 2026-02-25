import { chromium } from "@playwright/test";
import { mkdirSync } from "node:fs";
import path from "node:path";
import { migrateTestDb, resetAllTables } from "./seed/index.ts";
import { insertBaseFixtures } from "./seed/base.ts";
import { UPLOADS_PATH, AUTH_STATE_PATH } from "./paths.ts";

export default async function globalSetup() {
  mkdirSync(UPLOADS_PATH, { recursive: true });
  mkdirSync(path.dirname(AUTH_STATE_PATH), { recursive: true });

  await migrateTestDb();
  await resetAllTables();
  await insertBaseFixtures();

  const browser = await chromium.launch();
  const page = await browser.newPage();

  await page.goto("http://localhost:3100/signin");
  await page.getByLabel(/email/i).fill("e2e@test.com");
  await page.getByLabel(/password/i).fill("TestPassword1!");
  await page.getByRole("button", { name: /sign in/i }).click();
  await page.waitForURL((url) => !url.pathname.startsWith("/signin"));

  await page.context().storageState({ path: AUTH_STATE_PATH });
  await browser.close();
}
