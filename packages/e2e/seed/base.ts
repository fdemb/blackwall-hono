import { eq } from "drizzle-orm";
import * as schema from "@blackwall/database/schema";
import { openTestDb } from "./index.ts";

export const E2E = {
  user: {
    email: "e2e@test.com",
    password: "TestPassword1!",
    name: "E2E User",
  },
  workspace: {
    slug: "e2e-workspace",
    displayName: "E2E Workspace",
  },
  team: {
    key: "TES",
    name: "Testers",
  },
} as const;

export type BaseFixtures = {
  workspace: typeof schema.workspace.$inferSelect;
  user: typeof schema.user.$inferSelect;
  team: typeof schema.team.$inferSelect;
};

export async function insertBaseFixtures(): Promise<BaseFixtures> {
  const { db } = openTestDb();

  const [workspace] = await db
    .insert(schema.workspace)
    .values({
      slug: E2E.workspace.slug,
      displayName: E2E.workspace.displayName,
    })
    .returning();

  if (!workspace) throw new Error("Failed to create workspace");

  const passwordHash = await Bun.password.hash(E2E.user.password, {
    algorithm: "argon2id",
    memoryCost: 8192,
    timeCost: 1,
  });

  const now = new Date();
  const [user] = await db
    .insert(schema.user)
    .values({
      name: E2E.user.name,
      email: E2E.user.email,
      emailVerified: true,
      createdAt: now,
      updatedAt: now,
    })
    .returning();

  if (!user) throw new Error("Failed to create user");

  await db.insert(schema.account).values({
    userId: user.id,
    accountId: user.id,
    providerId: "credential",
    password: passwordHash,
  });

  await db.insert(schema.workspaceUser).values({
    workspaceId: workspace.id,
    userId: user.id,
  });

  const [team] = await db
    .insert(schema.team)
    .values({
      key: E2E.team.key,
      name: E2E.team.name,
      workspaceId: workspace.id,
    })
    .returning();

  if (!team) throw new Error("Failed to create team");

  await db.insert(schema.issueSequence).values({
    workspaceId: workspace.id,
    teamId: team.id,
    currentSequence: 0,
  });

  await db.insert(schema.userTeam).values({
    userId: user.id,
    teamId: team.id,
  });

  await db
    .update(schema.user)
    .set({ lastWorkspaceId: workspace.id, lastTeamId: team.id })
    .where(eq(schema.user.id, user.id));

  return { workspace, user, team };
}
