import { test, expect } from "../fixtures/index.ts";
import type { Page } from "@playwright/test";
import { resetAllTables } from "../seed/index.ts";
import { insertBaseFixtures } from "../seed/base.ts";
import { createIssue } from "../seed/factories.ts";

let issueKey: string;

async function logTime(page: Page, duration: string, description: string) {
  await page.getByTestId("time-entry-log-trigger").click();
  await page.getByTestId("time-entry-duration-input").fill(duration);
  await page.getByTestId("time-entry-description-input").fill(description);
  await page.getByTestId("time-entry-log-submit").click();
}

test.beforeAll(async () => {
  await resetAllTables();
  const { workspace, team, user } = await insertBaseFixtures();
  const issue = await createIssue({
    workspaceId: workspace.id,
    teamId: team.id,
    createdById: user.id,
    summary: "Time Entry Test Issue",
  });
  issueKey = issue.key;
});

test("log time on issue", async ({ page }) => {
  await page.goto(`/e2e-workspace/issue/${issueKey}`);

  await logTime(page, "90", "Investigation work");

  await expect(page.getByTestId("time-entry-log-trigger")).toContainText(/1h 30m|90m/i);
  await page.getByTestId("time-entry-history-trigger").click();
  await expect(page.getByText("Investigation work")).toBeVisible();
});

test("multiple logs update total time", async ({ page }) => {
  await page.goto(`/e2e-workspace/issue/${issueKey}`);

  await logTime(page, "60", "First block");
  await logTime(page, "30", "Second block");

  await expect(page.getByTestId("time-entry-log-trigger")).toContainText(/1h 30m|90m/i);
});

test("delete time entry", async ({ page }) => {
  await page.goto(`/e2e-workspace/issue/${issueKey}`);

  await logTime(page, "30", "Delete me entry");
  await page.getByTestId("time-entry-history-trigger").click();

  const entry = page.getByTestId("time-entry-item").filter({ hasText: "Delete me entry" }).first();
  await entry.hover();
  await entry.getByRole("button", { name: /more/i }).click();
  await page.getByRole("menuitem", { name: /^delete$/i }).click();
  await page.getByRole("alertdialog").getByRole("button", { name: /^delete$/i }).click();

  await expect(page.getByText("Delete me entry")).not.toBeVisible();
});
