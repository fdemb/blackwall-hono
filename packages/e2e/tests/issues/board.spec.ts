import { test, expect } from "../../fixtures/index.ts";
import type { Locator, Page } from "@playwright/test";
import { resetAllTables } from "../../seed/index.ts";
import { insertBaseFixtures } from "../../seed/base.ts";
import { createIssue, createSprint } from "../../seed/factories.ts";

let workspaceId: string;
let teamId: string;
let userId: string;
let toDoKey: string;
let inProgressKey: string;
let doneKey: string;

test.describe.configure({ timeout: 12_000 });

async function dragCardToColumn(page: Page, sourceCard: Locator, targetDropzone: Locator) {
  await sourceCard.scrollIntoViewIfNeeded();
  await targetDropzone.scrollIntoViewIfNeeded();

  const sourceBox = await sourceCard.boundingBox();
  const targetBox = await targetDropzone.boundingBox();
  if (!sourceBox || !targetBox) {
    throw new Error("Could not calculate drag coordinates for board card");
  }

  const sourceX = sourceBox.x + sourceBox.width / 2;
  const sourceY = sourceBox.y + sourceBox.height / 2;
  const targetX = targetBox.x + targetBox.width / 2;
  const targetY = targetBox.y + Math.min(targetBox.height / 2, 160);

  await page.mouse.move(sourceX, sourceY);
  await page.mouse.down();
  await page.waitForTimeout(650);
  await page.mouse.move(sourceX + 12, sourceY + 12, { steps: 4 });
  await page.mouse.move(targetX, targetY, { steps: 16 });
  await page.mouse.up();
}

test.beforeAll(async () => {
  await resetAllTables();
  const { workspace, team, user } = await insertBaseFixtures();
  workspaceId = workspace.id;
  teamId = team.id;
  userId = user.id;

  const sprint = await createSprint({
    teamId,
    createdById: userId,
    name: "Board Sprint",
    status: "active",
  });

  const issueToDo = await createIssue({
    workspaceId,
    teamId,
    createdById: userId,
    summary: "Board Issue To Do",
    status: "to_do",
    sprintId: sprint.id,
  });
  const issueInProgress = await createIssue({
    workspaceId,
    teamId,
    createdById: userId,
    summary: "Board Issue In Progress",
    status: "in_progress",
    sprintId: sprint.id,
  });
  const issueDone = await createIssue({
    workspaceId,
    teamId,
    createdById: userId,
    summary: "Board Issue Done",
    status: "done",
    sprintId: sprint.id,
  });

  toDoKey = issueToDo.key;
  inProgressKey = issueInProgress.key;
  doneKey = issueDone.key;
});

test("board loads with correct columns", async ({ page }) => {
  await page.goto("/e2e-workspace/team/TES/issues/board");

  await expect(page.getByTestId("board-column-to_do")).toBeVisible();
  await expect(page.getByTestId("board-column-in_progress")).toBeVisible();
  await expect(page.getByTestId("board-column-done")).toBeVisible();

  await expect(page.getByTestId(`board-card-${toDoKey}`)).toBeVisible();
  await expect(page.getByTestId(`board-card-${inProgressKey}`)).toBeVisible();
  await expect(page.getByTestId(`board-card-${doneKey}`)).toBeVisible();
});

test("drag issue from To Do to In Progress", async ({ page }) => {
  await page.goto("/e2e-workspace/team/TES/issues/board");

  const sourceCard = page.getByTestId(`board-card-${toDoKey}`);
  const targetColumn = page.getByTestId("board-column-in_progress");
  const targetDropzone = page.getByTestId("board-column-dropzone-in_progress");

  await dragCardToColumn(page, sourceCard, targetDropzone);

  await expect(targetColumn.getByTestId(`board-card-${toDoKey}`)).toBeVisible({ timeout: 8_000 });
});

test("drag issue from In Progress to Done", async ({ page }) => {
  await page.goto("/e2e-workspace/team/TES/issues/board");

  const sourceCard = page.getByTestId(`board-card-${inProgressKey}`);
  const targetColumn = page.getByTestId("board-column-done");
  const targetDropzone = page.getByTestId("board-column-dropzone-done");

  await dragCardToColumn(page, sourceCard, targetDropzone);

  await expect(targetColumn.getByTestId(`board-card-${inProgressKey}`)).toBeVisible({
    timeout: 8_000,
  });
});
