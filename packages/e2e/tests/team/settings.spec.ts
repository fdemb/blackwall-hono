import { test, expect } from "../../fixtures/index.ts";
import { resetAllTables } from "../../seed/index.ts";
import { insertBaseFixtures, E2E } from "../../seed/base.ts";

test.beforeEach(async () => {
  await resetAllTables();
  await insertBaseFixtures();
});

test("update team name", async ({ page }) => {
  await page.goto("/e2e-workspace/settings/teams/TES");

  const nameInput = page.getByLabel(/^name$/i);
  await nameInput.fill("Renamed Testers");
  await nameInput.blur();

  await expect(page.getByText(/team name updated/i)).toBeVisible();
  await expect(nameInput).toHaveValue("Renamed Testers");
});

test("update team key updates route", async ({ page }) => {
  await page.goto("/e2e-workspace/settings/teams/TES");

  const keyInput = page.getByLabel(/^key$/i);
  await keyInput.fill("DEV");
  await keyInput.blur();

  await expect(page).toHaveURL(/\/settings\/teams\/DEV$/);
  await expect(page.getByText(/team key updated/i)).toBeVisible();
});

test("view team members", async ({ page }) => {
  await page.goto("/e2e-workspace/settings/teams/TES");
  await expect(page.getByText(E2E.user.name)).toBeVisible();
});
