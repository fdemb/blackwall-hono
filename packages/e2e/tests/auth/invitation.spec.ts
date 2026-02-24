import { test, expect, type Page } from "@playwright/test";
import { eq } from "drizzle-orm";
import { resetAllTables, openTestDb } from "../../seed/index.ts";
import { insertBaseFixtures } from "../../seed/base.ts";
import { createInvitation, createUser } from "../../seed/factories.ts";
import * as schema from "@blackwall/database/schema";

let workspaceId: string;
let workspaceSlug: string;
let userId: string;
const BACKEND_URL = process.env.VITE_BACKEND_URL ?? "http://localhost:8000";

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

test("invitation page shows workspace context", async ({ page }) => {
  const token = crypto.randomUUID();
  await createInvitation({
    workspaceId,
    createdById: userId,
    email: "context@test.com",
    token,
  });

  await page.goto(`/invite/${token}`);

  await expect(page.getByText(/e2e workspace/i)).toBeVisible();
  await expect(page.getByLabel(/name/i)).toBeVisible();
  await expect(page.getByLabel(/password/i)).toBeVisible();
  await expect(page.getByRole("button", { name: /join workspace/i })).toBeVisible();
});

test("new user registers via invitation", async ({ page }) => {
  const token = crypto.randomUUID();
  await createInvitation({
    workspaceId,
    createdById: userId,
    email: "newregister@test.com",
    token,
  });

  await page.goto(`/invite/${token}`);
  await page.getByLabel(/name/i).fill("New Registrant");
  await page.getByLabel(/password/i).fill("TestPassword1!");
  await page.getByRole("button", { name: /join workspace/i }).click();

  await page.waitForURL(new RegExp(`/${workspaceSlug}/`));
  await expect(page).not.toHaveURL(/\/signin/);
});

test("existing user accepts invitation via authenticated endpoint", async ({ browser }) => {
  const token = crypto.randomUUID();
  const userB = await createUser({
    email: "userb@test.com",
    password: "TestPassword1!",
    name: "User B",
  });

  await createInvitation({ workspaceId, createdById: userId, email: userB.email, token });

  const context = await browser.newContext();
  const page = await context.newPage();
  await signIn(page, "userb@test.com", "TestPassword1!");

  const res = await page.request.post(`${BACKEND_URL}/api/invitations/${token}/accept`, {
    failOnStatusCode: false,
  });

  expect(res.status()).toBe(200);

  const { db } = openTestDb();
  const members = await db
    .select()
    .from(schema.workspaceUser)
    .where(eq(schema.workspaceUser.userId, userB.id));

  expect(members.some((m) => m.workspaceId === workspaceId)).toBe(true);
  await context.close();
});

test("invalid token shows error", async ({ page }) => {
  await page.goto("/invite/not-a-real-token");
  await expect(page.getByText(/not found|expired|invalid/i)).toBeVisible();
});

test("cancelled invitation shows error", async ({ page }) => {
  const token = crypto.randomUUID();
  const inv = await createInvitation({
    workspaceId,
    createdById: userId,
    email: "cancelled@test.com",
    token,
  });

  const { db } = openTestDb();
  await db
    .delete(schema.workspaceInvitation)
    .where(eq(schema.workspaceInvitation.id, inv.id));

  await page.goto(`/invite/${token}`);
  await expect(page.getByText(/not found|expired|invalid/i)).toBeVisible();
});
