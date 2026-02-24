import { test, expect } from "../../fixtures/index.ts";
import { resetAllTables } from "../../seed/index.ts";
import { insertBaseFixtures } from "../../seed/base.ts";
import { createIssue, createSprint } from "../../seed/factories.ts";

let workspaceId: string;
let teamId: string;
let userId: string;
let backlogIssueKey: string;

test.beforeAll(async () => {
  await resetAllTables();
  const { workspace, team, user } = await insertBaseFixtures();
  workspaceId = workspace.id;
  teamId = team.id;
  userId = user.id;

  const sprint = await createSprint({
    teamId,
    createdById: userId,
    name: "Backlog Sprint",
    status: "planned",
  });

  const backlogIssue = await createIssue({
    workspaceId,
    teamId,
    createdById: userId,
    summary: "Backlog Issue One",
  });

  backlogIssueKey = backlogIssue.key;

  await createIssue({
    workspaceId,
    teamId,
    createdById: userId,
    summary: "Backlog Issue Two",
    status: "in_progress",
  });

  await createIssue({
    workspaceId,
    teamId,
    createdById: userId,
    summary: "Sprint Issue One",
    sprintId: sprint.id,
  });
});

test("backlog shows issues without sprint", async ({ page }) => {
  await page.goto("/e2e-workspace/team/TES/issues/backlog");

  await expect(page.getByText("Backlog Issue One")).toBeVisible();
  await expect(page.getByText("Backlog Issue Two")).toBeVisible();
});

test("backlog excludes sprint issues", async ({ page }) => {
  await page.goto("/e2e-workspace/team/TES/issues/backlog");
  await expect(page.getByText("Sprint Issue One")).not.toBeVisible();
});

test("navigate to issue detail from backlog", async ({ page }) => {
  await page.goto("/e2e-workspace/team/TES/issues/backlog");
  await page.getByRole("link", { name: new RegExp(backlogIssueKey) }).first().click();

  await expect(page).toHaveURL(new RegExp(`/issue/${backlogIssueKey}`));
});

test("row selection menu appears when issue is selected", async ({ page }) => {
  await page.goto("/e2e-workspace/team/TES/issues/backlog");

  await page.getByLabel(/select row/i).first().click();
  await expect(page.getByText(/1 selected/i)).toBeVisible();
});
