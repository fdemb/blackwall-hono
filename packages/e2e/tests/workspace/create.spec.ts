import { test, expect } from "../../fixtures/index.ts";
import { resetAllTables } from "../../seed/index.ts";
import { insertBaseFixtures } from "../../seed/base.ts";

test.beforeAll(async () => {
  await resetAllTables();
  await insertBaseFixtures();
});

test("create additional workspace", async ({ page }) => {
  await page.goto("/create-workspace");
  await page.getByLabel(/workspace name/i).fill("Second Workspace");
  await page.getByLabel(/workspace url/i).fill("secondws");
  await page.getByRole("button", { name: /create/i }).click();

  await page.waitForURL("**/secondws/**");
  await expect(page.getByText("Second Workspace")).toBeVisible();
});

test("existing slug is rejected", async ({ page }) => {
  await page.goto("/create-workspace");
  await page.getByLabel(/workspace name/i).fill("Duplicate Workspace");
  await page.getByLabel(/workspace url/i).fill("e2e-workspace");
  await page.getByRole("button", { name: /create/i }).click();

  await expect(page).toHaveURL(/\/create-workspace/);
});

test("workspace URL field shows public prefix", async ({ page }) => {
  await page.goto("/create-workspace");
  await expect(page.getByText("https://blackwallapp.com/")).toBeVisible();
});
