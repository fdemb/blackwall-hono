import { test, expect } from "../../fixtures/index.ts";
import { eq } from "drizzle-orm";
import { resetAllTables, openTestDb } from "../../seed/index.ts";
import { insertBaseFixtures, E2E } from "../../seed/base.ts";
import * as schema from "@blackwall/database/schema";

test.beforeAll(async () => {
  await resetAllTables();
  await insertBaseFixtures();
});

test("view members list shows current user", async ({ page }) => {
  await page.goto("/e2e-workspace/members");
  const memberLink = page
    .getByTestId("workspace-members-list")
    .getByRole("link", { name: new RegExp(E2E.user.email) })
    .first();
  await expect(memberLink).toBeVisible();
});

test("invite member creates pending invitation", async ({ page }) => {
  const invitedEmail = "invited@test.com";

  await page.goto("/e2e-workspace/members");
  await page.getByTestId("workspace-members-invite-trigger").click();
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

test("view member profile page", async ({ page }) => {
  await page.goto("/e2e-workspace/members");
  await page
    .getByTestId("workspace-members-list")
    .getByRole("link", { name: new RegExp(E2E.user.email) })
    .first()
    .click();

  await expect(page).toHaveURL(/\/members\//);
  await expect(page.getByRole("heading", { name: E2E.user.name })).toBeVisible();
});
