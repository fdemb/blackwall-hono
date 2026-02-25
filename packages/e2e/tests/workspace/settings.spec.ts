import { test, expect } from "../../fixtures/index.ts";
import { eq } from "drizzle-orm";
import { resetAllTables, openTestDb } from "../../seed/index.ts";
import { insertBaseFixtures, E2E } from "../../seed/base.ts";
import * as schema from "@blackwall/database/schema";

test.beforeAll(async () => {
  await resetAllTables();
  await insertBaseFixtures();
});

test("update workspace display name", async ({ page }) => {
  await page.goto("/e2e-workspace/settings/workspace");

  const nameInput = page.getByRole("textbox", { name: /^workspace name$/i });
  await nameInput.fill("Updated Name");
  await nameInput.blur();

  await expect(page.getByText(/workspace name updated/i)).toBeVisible();
  await expect(nameInput).toHaveValue("Updated Name");
});

test("workspace settings shows members section", async ({ page }) => {
  await page.goto("/e2e-workspace/settings/workspace");

  await expect(page.getByTestId("workspace-settings-invite-trigger")).toBeVisible();
  await expect(page.getByTestId("workspace-settings-members-list").getByText(E2E.user.name)).toBeVisible();
});

test("invite member from workspace settings creates invitation", async ({ page }) => {
  const invitedEmail = "workspace-invite@test.com";

  await page.goto("/e2e-workspace/settings/workspace");
  await page.getByTestId("workspace-settings-invite-trigger").click();
  const dialog = page.getByRole("alertdialog", { name: /invite user/i });
  await expect(dialog).toBeVisible();
  await dialog.getByLabel(/email address/i).fill(invitedEmail);
  const submit = dialog.getByTestId("invite-dialog-submit");
  await expect(submit).toBeEnabled();
  await Promise.all([
    page.waitForResponse(
      (res) =>
        res.url().includes("/api/invitations") &&
        res.request().method() === "POST" &&
        res.ok(),
    ),
    submit.click(),
  ]);
  await expect(dialog).not.toBeVisible();

  const { db } = openTestDb();
  const invitations = await db
    .select()
    .from(schema.workspaceInvitation)
    .where(eq(schema.workspaceInvitation.email, invitedEmail))
    .limit(1);

  expect(invitations.length).toBe(1);
});
