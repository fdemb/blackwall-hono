import { test as base, expect, type Page } from "@playwright/test";
import { E2E } from "../seed/base.ts";

async function ensureSignedIn(page: Page) {
  await page.goto("/signin");

  if (!page.url().includes("/signin")) {
    return;
  }

  await page.getByLabel(/email/i).fill(E2E.user.email);
  await page.getByLabel(/password/i).fill(E2E.user.password);
  await page.getByRole("button", { name: /sign in/i }).click();
  await expect(page).not.toHaveURL(/\/signin/);
}

export const test = base.extend({
  page: async ({ browser }, use) => {
    const context = await browser.newContext();
    const page = await context.newPage();
    await ensureSignedIn(page);
    await use(page);
    await context.close();
  },
});

export { expect };
