import { test, expect } from "../fixtures/index.ts";
import type { Page as PWPage } from "@playwright/test";
import { eq } from "drizzle-orm";
import { resetAllTables, openTestDb } from "../seed/index.ts";
import { insertBaseFixtures } from "../seed/base.ts";
import { createIssue, createLabel } from "../seed/factories.ts";
import * as schema from "@blackwall/database/schema";

let workspaceId: string;
let teamId: string;
let userId: string;
let issueKey: string;

async function openLabelsPicker(page: PWPage) {
  await page.getByTestId("issue-labels-picker-trigger").click();
  await expect(page.getByTestId("picker-search-input").last()).toBeVisible();
}

function issueLabelBadge(page: PWPage, labelName: string) {
  return page.getByTestId("issue-label-badge").filter({ hasText: labelName });
}

async function toggleLabel(page: PWPage, labelName: string) {
  await openLabelsPicker(page);
  await page.getByRole("option", { name: labelName }).click();
  await page.keyboard.press("Escape");
}

test.beforeAll(async () => {
  await resetAllTables();
  const { workspace, team, user } = await insertBaseFixtures();
  workspaceId = workspace.id;
  teamId = team.id;
  userId = user.id;
  const issue = await createIssue({
    workspaceId,
    teamId,
    createdById: userId,
    summary: "Label Test Issue",
  });
  issueKey = issue.key;
});

test("create label", async ({ page }) => {
  await page.goto(`/e2e-workspace/issue/${issueKey}`);

  await openLabelsPicker(page);
  await page.getByTestId("picker-search-input").last().fill("Bug");
  await page.keyboard.press("Enter");

  await expect(issueLabelBadge(page, "Bug")).toBeVisible();
});

test("add label to issue", async ({ page }) => {
  await createLabel({ workspaceId, name: "Feature", colorKey: "green" });

  await page.goto(`/e2e-workspace/issue/${issueKey}`);
  await toggleLabel(page, "Feature");

  await expect(issueLabelBadge(page, "Feature")).toBeVisible();
});

test("remove label from issue", async ({ page }) => {
  const label = await createLabel({ workspaceId, name: "Remove Me", colorKey: "red" });

  await page.goto(`/e2e-workspace/issue/${issueKey}`);
  await toggleLabel(page, label.name);
  await expect(issueLabelBadge(page, label.name)).toBeVisible();

  await toggleLabel(page, label.name);
  await expect(issueLabelBadge(page, label.name)).toHaveCount(0);
});

test("rename label reflects everywhere", async ({ page }) => {
  const label = await createLabel({ workspaceId, name: "Old Name", colorKey: "orange" });

  await page.goto(`/e2e-workspace/issue/${issueKey}`);
  await toggleLabel(page, label.name);
  await expect(issueLabelBadge(page, label.name)).toBeVisible();

  const { db } = openTestDb();
  await db
    .update(schema.label)
    .set({ name: "New Name" })
    .where(eq(schema.label.id, label.id));

  await page.reload();
  await expect(issueLabelBadge(page, "New Name")).toBeVisible();
  await expect(issueLabelBadge(page, "Old Name")).toHaveCount(0);
});

test("delete label removes it from workspace", async ({ page }) => {
  const label = await createLabel({ workspaceId, name: "DeleteLabel", colorKey: "violet" });

  await page.goto(`/e2e-workspace/issue/${issueKey}`);
  await openLabelsPicker(page);
  await page.getByTestId("picker-search-input").last().fill(label.name);
  await expect(page.getByRole("option", { name: label.name })).toBeVisible();
  await page.keyboard.press("Escape");

  const { db } = openTestDb();
  await db.delete(schema.label).where(eq(schema.label.id, label.id));

  await page.reload();
  await openLabelsPicker(page);
  await page.getByTestId("picker-search-input").last().fill(label.name);
  await expect(page.getByRole("option", { name: label.name })).not.toBeVisible();
});
