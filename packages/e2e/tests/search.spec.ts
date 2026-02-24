import { test, expect } from "../fixtures/index.ts";
import type { Page as PWPage } from "@playwright/test";
import { resetAllTables } from "../seed/index.ts";
import { insertBaseFixtures } from "../seed/base.ts";
import { createIssue, textDoc } from "../seed/factories.ts";

let issueKey: string;

async function openSearch(page: PWPage) {
  await page.getByTestId("global-search-trigger").click();
  await expect(page.getByRole("combobox", { name: /search/i })).toBeVisible();
}

test.beforeAll(async () => {
  await resetAllTables();
  const { workspace, team, user } = await insertBaseFixtures();
  const issue = await createIssue({
    workspaceId: workspace.id,
    teamId: team.id,
    createdById: user.id,
    summary: "playwright-unique-title-xyz",
    description: textDoc("searchable-keyword-abc unique content"),
  });
  issueKey = issue.key;
});

test("search by issue title returns result", async ({ page }) => {
  await page.goto("/e2e-workspace");

  await openSearch(page);
  await page.getByRole("combobox", { name: /search/i }).fill("playwright-unique-title");

  await expect(page.getByText("playwright-unique-title-xyz")).toBeVisible();
});

test("search by description keyword returns result", async ({ page }) => {
  await page.goto("/e2e-workspace");

  await openSearch(page);
  await page.getByRole("combobox", { name: /search/i }).fill("searchable-keyword-abc");

  await expect(page.getByText("playwright-unique-title-xyz")).toBeVisible();
});

test("empty search shows no error", async ({ page }) => {
  await page.goto("/e2e-workspace");

  await openSearch(page);
  await expect(page.getByRole("combobox", { name: /search/i })).toBeVisible();
  await expect(page.getByText(/error/i)).not.toBeVisible();
});

test("click result navigates to issue", async ({ page }) => {
  await page.goto("/e2e-workspace");

  await openSearch(page);
  await page.getByRole("combobox", { name: /search/i }).fill("playwright-unique-title");
  await page.getByText("playwright-unique-title-xyz").click();

  await expect(page).toHaveURL(new RegExp(`/issue/${issueKey}`));
});
