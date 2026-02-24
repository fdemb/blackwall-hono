import { test, expect } from "../../fixtures/index.ts";
import { resetAllTables } from "../../seed/index.ts";
import { insertBaseFixtures } from "../../seed/base.ts";
import { createIssue } from "../../seed/factories.ts";

let workspaceId: string;
let teamId: string;
let userId: string;
let issueKey: string;
const SELECT_ALL_SHORTCUT = process.platform === "darwin" ? "Meta+a" : "Control+a";

test.beforeAll(async () => {
  await resetAllTables();
  const { workspace, team, user } = await insertBaseFixtures();
  workspaceId = workspace.id;
  teamId = team.id;
  userId = user.id;

  const issue = await createIssue({
    workspaceId,
    teamId,
    createdById: user.id,
    summary: "Detail Test Issue",
  });

  issueKey = issue.key;
});

test("navigate to issue detail", async ({ page }) => {
  await page.goto("/e2e-workspace/team/TES/issues/backlog");
  await page.getByRole("link", { name: new RegExp(issueKey) }).first().click();

  await expect(page).toHaveURL(new RegExp(`/issue/${issueKey}`));
  await expect(page.getByRole("heading", { name: "Detail Test Issue" })).toBeVisible();
});

test("edit issue title inline", async ({ page }) => {
  await page.goto(`/e2e-workspace/issue/${issueKey}`);

  const title = page.getByTestId("issue-summary-input");
  await title.click();
  await page.keyboard.press(SELECT_ALL_SHORTCUT);
  await page.keyboard.type("Updated Title");
  await page.getByTestId("issue-edit-save").click();

  await expect(page.getByText("Updated Title")).toBeVisible();
});

test("change status to In Progress", async ({ page }) => {
  await page.goto(`/e2e-workspace/issue/${issueKey}`);

  await page.getByRole("button", { name: /to do|in progress|done/i }).first().click();
  await page.getByRole("option", { name: /in progress/i }).click();

  await expect(page.getByRole("button", { name: /in progress/i })).toBeVisible();
});

test("change status to Done", async ({ page }) => {
  await page.goto(`/e2e-workspace/issue/${issueKey}`);

  await page.getByRole("button", { name: /to do|in progress|done/i }).first().click();
  await page.getByRole("option", { name: /^done$/i }).click();

  await expect(page.getByRole("button", { name: /^done$/i })).toBeVisible();
});

test("change priority to Urgent", async ({ page }) => {
  await page.goto(`/e2e-workspace/issue/${issueKey}`);

  await page.getByRole("button", { name: /low|medium|high|urgent/i }).first().click();
  await page.getByRole("option", { name: /urgent/i }).click();

  await expect(page.getByRole("button", { name: /urgent/i })).toBeVisible();
});

test("assign to self", async ({ page }) => {
  await page.goto(`/e2e-workspace/issue/${issueKey}`);

  await page.getByRole("button", { name: /no one|unassigned|e2e user/i }).first().click();
  await page.getByRole("option", { name: "E2E User" }).click();

  await expect(page.getByRole("button", { name: /e2e user/i })).toBeVisible();
});

test("edit rich text description", async ({ page }) => {
  await page.goto(`/e2e-workspace/issue/${issueKey}`);

  const editor = page.getByTestId("issue-description-editor");
  await expect(editor).toBeVisible();
  await editor.click();
  await page.keyboard.press(SELECT_ALL_SHORTCUT);
  await page.keyboard.type("Test description content");
  await page.getByTestId("issue-edit-save").click();

  await page.reload();
  await expect(page.getByText("Test description content")).toBeVisible();
});

test("activity feed is visible", async ({ page }) => {
  await page.goto(`/e2e-workspace/issue/${issueKey}`);
  await expect(page.getByTestId("issue-comment-form")).toBeVisible();
  await expect(page.getByTestId("issue-activity-log")).toBeVisible();
});

test("delete issue removes it from list", async ({ page }) => {
  const issue = await createIssue({
    workspaceId,
    teamId,
    createdById: userId,
    summary: "Issue to Delete",
  });

  await page.goto(`/e2e-workspace/issue/${issue.key}`);
  await page.getByTestId("issue-menu-trigger").click();
  await page.getByRole("menuitem", { name: /delete/i }).click();
  await page.getByRole("button", { name: /^delete$/i }).last().click();

  await page.goto("/e2e-workspace/team/TES/issues/backlog");
  await expect(page.getByText("Issue to Delete")).not.toBeVisible();
});
