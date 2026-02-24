import { test, expect } from "../../fixtures/index.ts";
import { resetAllTables } from "../../seed/index.ts";
import { insertBaseFixtures } from "../../seed/base.ts";
import { createIssue, createSprint } from "../../seed/factories.ts";

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

test("view sprint details", async ({ page }) => {
  const sprint = await createSprint({
    teamId,
    createdById: userId,
    name: "View Sprint",
    goal: "See it",
    status: "planned",
  });

  await page.goto(`/e2e-workspace/team/TES/sprints/${sprint.id}`);
  await expect(page.getByRole("heading", { name: "View Sprint" })).toBeVisible();
  await expect(page.getByText("See it")).toBeVisible();
});

test("edit sprint name", async ({ page }) => {
  const sprint = await createSprint({
    teamId,
    createdById: userId,
    name: "Edit Me Sprint",
    status: "planned",
  });

  await page.goto(`/e2e-workspace/team/TES/sprints/${sprint.id}/edit`);

  const nameInput = page.getByLabel(/^name$/i);
  await nameInput.fill("Renamed Sprint");
  await page.getByRole("button", { name: /save changes/i }).click();

  await expect(page.getByRole("heading", { name: "Renamed Sprint" })).toBeVisible();
});

test("complete sprint moves unfinished issues to backlog", async ({ page }) => {
  const sprint = await createSprint({
    teamId,
    createdById: userId,
    name: "Complete Me Sprint",
    status: "active",
  });

  await createIssue({
    workspaceId,
    teamId,
    createdById: userId,
    summary: "Done Issue",
    status: "done",
    sprintId: sprint.id,
  });
  await createIssue({
    workspaceId,
    teamId,
    createdById: userId,
    summary: "Leftover Issue",
    status: "to_do",
    sprintId: sprint.id,
  });

  await page.goto(`/e2e-workspace/team/TES/sprints/${sprint.id}/complete`);
  await page.getByRole("button", { name: /complete sprint/i }).click();

  await page.waitForURL(/\/sprints$/);

  await page.goto("/e2e-workspace/team/TES/issues/backlog");
  await expect(page.getByText("Leftover Issue")).toBeVisible();
});

test("start planned sprint from detail page", async ({ page }) => {
  const sprint = await createSprint({
    teamId,
    createdById: userId,
    name: "Start Me Sprint",
    status: "planned",
  });

  await page.goto(`/e2e-workspace/team/TES/sprints/${sprint.id}`);
  await page.getByRole("button", { name: /start sprint/i }).click();

  await expect(page.getByText(/active/i)).toBeVisible();
});

test("archive planned sprint", async ({ page }) => {
  const sprint = await createSprint({
    teamId,
    createdById: userId,
    name: "Archive Me Sprint",
    status: "planned",
  });

  await page.goto(`/e2e-workspace/team/TES/sprints/${sprint.id}`);
  await page.getByRole("button", { name: /archive/i }).click();
  await page.getByRole("button", { name: /archive/i }).last().click();

  await page.goto("/e2e-workspace/team/TES/sprints");
  await expect(page.getByText("Archive Me Sprint")).not.toBeVisible();
});
