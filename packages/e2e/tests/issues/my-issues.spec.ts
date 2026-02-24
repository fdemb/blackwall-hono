import { test, expect } from "../../fixtures/index.ts";
import { resetAllTables } from "../../seed/index.ts";
import { insertBaseFixtures } from "../../seed/base.ts";
import { createIssue, createUser } from "../../seed/factories.ts";

test.beforeAll(async () => {
  await resetAllTables();
  const { workspace, team, user } = await insertBaseFixtures();

  const other = await createUser({
    email: "other@test.com",
    password: "TestPassword1!",
    name: "Other User",
    workspaceId: workspace.id,
    teamId: team.id,
  });

  await createIssue({
    workspaceId: workspace.id,
    teamId: team.id,
    createdById: user.id,
    summary: "My Assigned Issue",
    assignedToId: user.id,
  });
  await createIssue({
    workspaceId: workspace.id,
    teamId: team.id,
    createdById: user.id,
    summary: "Others Assigned Issue",
    assignedToId: other.id,
  });
  await createIssue({
    workspaceId: workspace.id,
    teamId: team.id,
    createdById: user.id,
    summary: "Unassigned Issue",
  });
});

test("My Issues shows issues assigned to current user", async ({ page }) => {
  await page.goto("/e2e-workspace/my-issues");
  await expect(page.getByText("My Assigned Issue")).toBeVisible();
});

test("My Issues excludes issues assigned to others", async ({ page }) => {
  await page.goto("/e2e-workspace/my-issues");
  await expect(page.getByText("Others Assigned Issue")).not.toBeVisible();
});

test("My Issues excludes unassigned issues", async ({ page }) => {
  await page.goto("/e2e-workspace/my-issues");
  await expect(page.getByText("Unassigned Issue")).not.toBeVisible();
});
