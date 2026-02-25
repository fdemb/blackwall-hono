import { test, expect } from "../fixtures/index.ts";
import type { Page } from "@playwright/test";
import { resetAllTables } from "../seed/index.ts";
import { insertBaseFixtures } from "../seed/base.ts";
import { createIssue } from "../seed/factories.ts";

let workspaceId: string;
let teamId: string;
let userId: string;

async function createTestIssue(summary: string) {
  const issue = await createIssue({
    workspaceId,
    teamId,
    createdById: userId,
    summary,
  });
  return issue.key;
}

async function logTime(page: Page, issueKey: string, duration: string, description: string) {
  await page.getByTestId("time-entry-log-trigger").first().click();
  const dialog = page.getByRole("alertdialog", { name: /log time/i });
  await expect(dialog).toBeVisible();
  await dialog.getByTestId("time-entry-duration-input").fill(duration);
  await dialog.getByTestId("time-entry-description-input").fill(description);
  const submit = dialog.getByTestId("time-entry-log-submit");
  await expect(submit).toBeEnabled();
  await Promise.all([
    page.waitForResponse(
      (res) =>
        res.url().includes(`/api/time-entries/issues/${issueKey}/time-entries`) &&
        res.request().method() === "POST",
    ),
    submit.click(),
  ]);
  await expect(dialog).not.toBeVisible();
}

test.beforeAll(async () => {
  await resetAllTables();
  const { workspace, team, user } = await insertBaseFixtures();
  workspaceId = workspace.id;
  teamId = team.id;
  userId = user.id;
});

test("log time on issue", async ({ page }) => {
  const issueKey = await createTestIssue("Time Entry Test Issue: single log");
  await page.goto(`/e2e-workspace/issue/${issueKey}`);

  await logTime(page, issueKey, "90", "Investigation work");

  await expect(page.getByTestId("time-entry-log-trigger")).toContainText(/1h 30m|90m/i);
  await page.getByTestId("time-entry-history-trigger").click();
  await expect(page.getByText("Investigation work")).toBeVisible();
});

test("multiple logs update total time", async ({ page }) => {
  const issueKey = await createTestIssue("Time Entry Test Issue: multiple logs");
  await page.goto(`/e2e-workspace/issue/${issueKey}`);

  await logTime(page, issueKey, "60", "First block");
  await logTime(page, issueKey, "30", "Second block");

  await expect(page.getByTestId("time-entry-log-trigger")).toContainText(/1h 30m|90m/i);
});

test("delete time entry", async ({ page }) => {
  const issueKey = await createTestIssue("Time Entry Test Issue: delete log");
  await page.goto(`/e2e-workspace/issue/${issueKey}`);

  await logTime(page, issueKey, "30", "Delete me entry");
  await page.getByTestId("time-entry-history-trigger").click();

  const entry = page.getByTestId("time-entry-item").filter({ hasText: "Delete me entry" }).first();
  await entry.hover();
  await entry.getByRole("button", { name: /more/i }).click();
  await page.getByRole("menuitem", { name: /^delete$/i }).click();
  await page.getByRole("alertdialog").getByRole("button", { name: /^delete$/i }).click();

  await expect(page.getByText("Delete me entry")).not.toBeVisible();
});
