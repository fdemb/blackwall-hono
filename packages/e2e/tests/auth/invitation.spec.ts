import { test, expect, type Page } from "@playwright/test";
import { resetAllTables } from "../../seed/index.ts";
import { insertBaseFixtures } from "../../seed/base.ts";
import { createInvitation, createUser } from "../../seed/factories.ts";

let workspaceId: string;
let workspaceSlug: string;
let userId: string;

async function signIn(page: Page, email: string, password: string) {
  await page.goto("/signin");
  await page.getByLabel(/email/i).fill(email);
  await page.getByLabel(/password/i).fill(password);
  await page.getByRole("button", { name: /sign in/i }).click();
  await expect(page).not.toHaveURL(/\/signin/);
}

test.beforeAll(async () => {
  await resetAllTables();
  const { workspace, user } = await insertBaseFixtures();
  workspaceId = workspace.id;
  workspaceSlug = workspace.slug;
  userId = user.id;
});

test("invitation page shows workspace name and register form", async ({ page }) => {
  const token = crypto.randomUUID();
  await createInvitation({ workspaceId, createdById: userId, email: "context@test.com", token });

  await page.goto(`/invite/${token}`);

  await expect(page.getByText(/e2e workspace/i)).toBeVisible();
  await expect(page.getByLabel(/name/i)).toBeVisible();
  await expect(page.getByLabel(/password/i)).toBeVisible();
  await expect(page.getByRole("button", { name: /join workspace/i })).toBeVisible();
});

test("new user registers via invitation and lands on workspace", async ({ page }) => {
  const token = crypto.randomUUID();
  await createInvitation({ workspaceId, createdById: userId, email: "newregister@test.com", token });

  await page.goto(`/invite/${token}`);
  await page.getByLabel(/name/i).fill("New Registrant");
  await page.getByLabel(/password/i).fill("TestPassword1!");
  await page.getByRole("button", { name: /join workspace/i }).click();

  await page.waitForURL(new RegExp(`/${workspaceSlug}`));
});

test("authenticated user with matching email sees join button and accepts", async ({ browser }) => {
  const token = crypto.randomUUID();
  const userB = await createUser({ email: "userb@test.com", password: "TestPassword1!", name: "User B" });
  await createInvitation({ workspaceId, createdById: userId, email: userB.email, token });

  const context = await browser.newContext();
  const page = await context.newPage();
  await signIn(page, "userb@test.com", "TestPassword1!");

  await page.goto(`/invite/${token}`);
  await expect(page.getByRole("button", { name: /join as user b/i })).toBeVisible();
  await page.getByRole("button", { name: /join as user b/i }).click();

  await page.waitForURL(new RegExp(`/${workspaceSlug}`));
  await context.close();
});

test("authenticated user with wrong email sees wrong account message", async ({ browser }) => {
  const token = crypto.randomUUID();
  await createInvitation({ workspaceId, createdById: userId, email: "someoneelse@test.com", token });

  const wrongUser = await createUser({ email: "wronguser@test.com", password: "TestPassword1!", name: "Wrong User" });

  const context = await browser.newContext();
  const page = await context.newPage();
  await signIn(page, wrongUser.email, "TestPassword1!");

  await page.goto(`/invite/${token}`);
  await expect(page.getByText(/wrong account/i)).toBeVisible();
  await context.close();
});

test("invitation is consumed after use and token no longer works", async ({ page }) => {
  const token = crypto.randomUUID();
  await createInvitation({ workspaceId, createdById: userId, email: "useonce@test.com", token });

  await page.goto(`/invite/${token}`);
  await page.getByLabel(/name/i).fill("Use Once");
  await page.getByLabel(/password/i).fill("TestPassword1!");
  await page.getByRole("button", { name: /join workspace/i }).click();
  await page.waitForURL(new RegExp(`/${workspaceSlug}`));

  await page.goto(`/invite/${token}`);
  await expect(page.getByText(/not found|expired|invalid/i)).toBeVisible();
});

test("invalid token shows error", async ({ page }) => {
  await page.goto("/invite/not-a-real-token");
  await expect(page.getByText(/not found|expired|invalid/i)).toBeVisible();
});
