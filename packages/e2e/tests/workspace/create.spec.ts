import { test, expect } from "../../fixtures/index.ts";
import { resetAllTables } from "../../seed/index.ts";
import { insertBaseFixtures } from "../../seed/base.ts";

test.beforeAll(async () => {
  await resetAllTables();
  await insertBaseFixtures();
});

test("create additional workspace", async ({ page }) => {
  await page.goto("/create-workspace");
  await page.getByLabel("Name").fill("Second Workspace");
  await page.getByLabel("URL").fill("secondws");
  await page.getByRole("button", { name: "Create Workspace" }).click();

  await page.waitForURL("**/secondws/**");
  await expect(page.getByText("Second Workspace")).toBeVisible();
});

test("existing slug is rejected", async ({ page }) => {
  await page.goto("/create-workspace");
  await page.getByLabel("Name").fill("Duplicate Workspace");
  await page.getByLabel("URL").fill("e2e-workspace");
  await page.getByRole("button", { name: "Create Workspace" }).click();

  await expect(page).toHaveURL(/\/create-workspace/);
});
