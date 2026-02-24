import { test, expect } from "../fixtures/index.ts";
import type { Locator, Page } from "@playwright/test";
import { resetAllTables } from "../seed/index.ts";
import { insertBaseFixtures } from "../seed/base.ts";
import { createIssue } from "../seed/factories.ts";
import path from "node:path";
import { writeFileSync, mkdirSync } from "node:fs";

let issueKey: string;
const FIXTURE_DIR = path.resolve(import.meta.dirname, "../.e2e/fixtures");
const SELECT_ALL_SHORTCUT = process.platform === "darwin" ? "Meta+a" : "Control+a";

function ensureFixtureFiles() {
  mkdirSync(FIXTURE_DIR, { recursive: true });

  writeFileSync(
    path.join(FIXTURE_DIR, "test-image.png"),
    Buffer.from(
      "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==",
      "base64",
    ),
  );

  writeFileSync(
    path.join(FIXTURE_DIR, "test-image-2.png"),
    Buffer.from(
      "iVBORw0KGgoAAAANSUhEUgAAAAIAAAACCAYAAABytg0kAAAAFElEQVR42mNkYGD4z0ABYBxVSFUAABqWAgN4N2VNAAAAAElFTkSuQmCC",
      "base64",
    ),
  );
}

async function uploadImageFromSlashMenu(page: Page, filePath: string, editor: Locator) {
  await expect(editor).toBeVisible();
  await editor.click();

  const fileChooserPromise = page.waitForEvent("filechooser");
  await page.keyboard.type("/image");
  await page.keyboard.press("Enter");

  const chooser = await fileChooserPromise;
  await chooser.setFiles(filePath);
}

test.beforeAll(async () => {
  ensureFixtureFiles();
  await resetAllTables();
  const { workspace, team, user } = await insertBaseFixtures();
  const issue = await createIssue({
    workspaceId: workspace.id,
    teamId: team.id,
    createdById: user.id,
    summary: "Attachment Test Issue",
  });
  issueKey = issue.key;
});

test("upload image attachment in issue description", async ({ page }) => {
  await page.goto(`/e2e-workspace/issue/${issueKey}`);

  const descriptionEditor = page.getByTestId("issue-description-editor");
  await uploadImageFromSlashMenu(page, path.join(FIXTURE_DIR, "test-image.png"), descriptionEditor);
  await page.getByTestId("issue-edit-save").click();

  await expect(page.locator("img[src*='/api/issues/attachments/']").first()).toBeVisible();
});

test("upload image attachment in comment", async ({ page }) => {
  await page.goto(`/e2e-workspace/issue/${issueKey}`);

  const commentEditor = page.getByTestId("issue-comment-editor");

  await uploadImageFromSlashMenu(page, path.join(FIXTURE_DIR, "test-image-2.png"), commentEditor);
  await page.getByTestId("issue-comment-submit").click();

  await expect(
    page
      .getByTestId("issue-comment-item")
      .first()
      .locator("img[src*='/api/issues/attachments/']")
      .first(),
  ).toBeVisible();
});

test("uploaded attachment persists after reload", async ({ page }) => {
  await page.goto(`/e2e-workspace/issue/${issueKey}`);

  const descriptionEditor = page.getByTestId("issue-description-editor");
  await uploadImageFromSlashMenu(page, path.join(FIXTURE_DIR, "test-image.png"), descriptionEditor);
  await page.getByTestId("issue-edit-save").click();

  await page.reload();
  await expect(page.locator("img[src*='/api/issues/attachments/']").first()).toBeVisible();
});

test("remove attachment from issue description", async ({ page }) => {
  await page.goto(`/e2e-workspace/issue/${issueKey}`);

  const descriptionEditor = page.getByTestId("issue-description-editor");
  await uploadImageFromSlashMenu(page, path.join(FIXTURE_DIR, "test-image.png"), descriptionEditor);
  await page.getByTestId("issue-edit-save").click();

  await descriptionEditor.click();
  await page.keyboard.press(SELECT_ALL_SHORTCUT);
  await page.keyboard.press("Backspace");
  await page.getByTestId("issue-edit-save").click();

  await page.reload();
  await expect(page.locator("img[src*='/api/issues/attachments/']")).toHaveCount(0);
});
