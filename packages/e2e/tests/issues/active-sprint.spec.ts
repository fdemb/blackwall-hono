import { test, expect } from "../../fixtures/index.ts";
import { resetAllTables } from "../../seed/index.ts";
import { insertBaseFixtures } from "../../seed/base.ts";
import { createIssue } from "../../seed/factories.ts";

let workspaceId: string;
let teamId: string;
let userId: string;

test.beforeAll(async () => {
  await resetAllTables();
  const { workspace, team, user } = await insertBaseFixtures();
  workspaceId = workspace.id;
  teamId = team.id;
  userId = user.id;
});

test("empty state shown with no active issues", async ({ page }) => {
  await page.goto("/e2e-workspace/team/TES/issues/active");
  await expect(page.getByText("No active issues", { exact: true })).toBeVisible();
});

test("active issues page shows to do and in progress issues", async ({ page }) => {
  await createIssue({ workspaceId, teamId, createdById: userId, summary: "Active To Do", status: "to_do" });
  await createIssue({ workspaceId, teamId, createdById: userId, summary: "Active In Progress", status: "in_progress" });
  await createIssue({ workspaceId, teamId, createdById: userId, summary: "Done Issue", status: "done" });

  await page.goto("/e2e-workspace/team/TES/issues/active");

  await expect(page.getByText("Active To Do")).toBeVisible();
  await expect(page.getByText("Active In Progress")).toBeVisible();
  await expect(page.getByText("Done Issue")).not.toBeVisible();
});
