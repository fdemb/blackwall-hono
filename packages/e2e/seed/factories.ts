import { and, eq, sql } from "drizzle-orm";
import * as schema from "@blackwall/database/schema";
import { openTestDb } from "./index.ts";

type JSONContent = {
  type?: string;
  attrs?: Record<string, unknown>;
  content?: JSONContent[];
  marks?: Array<{ type: string; attrs?: Record<string, unknown> }>;
  text?: string;
};

function emptyDoc(): JSONContent {
  return { type: "doc", content: [{ type: "paragraph" }] };
}

function textDoc(text: string): JSONContent {
  return {
    type: "doc",
    content: [{ type: "paragraph", content: [{ type: "text", text }] }],
  };
}

export type CreateIssueOpts = {
  workspaceId: string;
  teamId: string;
  createdById: string;
  summary: string;
  status?: "to_do" | "in_progress" | "done";
  priority?: "low" | "medium" | "high" | "urgent";
  sprintId?: string;
  assignedToId?: string;
  estimationPoints?: number;
  description?: JSONContent;
};

export async function createIssue(
  opts: CreateIssueOpts,
): Promise<typeof schema.issue.$inferSelect> {
  const { db } = openTestDb();

  const [seq] = await db
    .update(schema.issueSequence)
    .set({ currentSequence: sql`${schema.issueSequence.currentSequence} + 1` })
    .where(
      and(
        eq(schema.issueSequence.workspaceId, opts.workspaceId),
        eq(schema.issueSequence.teamId, opts.teamId),
      ),
    )
    .returning();

  if (!seq) throw new Error("Failed to increment issue sequence");

  const keyNumber = seq.currentSequence;
  const teamKey = await db
    .select({ key: schema.team.key })
    .from(schema.team)
    .where(eq(schema.team.id, opts.teamId))
    .then((rows) => rows[0]?.key);

  if (!teamKey) throw new Error(`Team not found: ${opts.teamId}`);

  const [issue] = await db
    .insert(schema.issue)
    .values({
      key: `${teamKey}-${keyNumber}`,
      keyNumber,
      workspaceId: opts.workspaceId,
      teamId: opts.teamId,
      createdById: opts.createdById,
      summary: opts.summary,
      status: opts.status ?? "to_do",
      priority: opts.priority ?? "medium",
      description: opts.description ?? emptyDoc(),
      order: keyNumber,
      sprintId: opts.sprintId ?? null,
      assignedToId: opts.assignedToId ?? null,
      estimationPoints: opts.estimationPoints ?? null,
    })
    .returning();

  if (!issue) throw new Error("Failed to create issue");
  return issue;
}

export type CreateSprintOpts = {
  teamId: string;
  createdById: string;
  name: string;
  goal?: string;
  status?: "planned" | "active" | "completed";
  startDate?: Date;
  endDate?: Date;
};

export async function createSprint(
  opts: CreateSprintOpts,
): Promise<typeof schema.issueSprint.$inferSelect> {
  const { db } = openTestDb();

  const now = new Date();
  const [sprint] = await db
    .insert(schema.issueSprint)
    .values({
      teamId: opts.teamId,
      createdById: opts.createdById,
      name: opts.name,
      goal: opts.goal ?? null,
      status: opts.status ?? "planned",
      startDate: opts.startDate ?? now,
      endDate: opts.endDate ?? new Date(now.getTime() + 14 * 24 * 60 * 60 * 1000),
    })
    .returning();

  if (!sprint) throw new Error("Failed to create sprint");

  if (sprint.status === "active") {
    await db
      .update(schema.team)
      .set({ activeSprintId: sprint.id })
      .where(eq(schema.team.id, opts.teamId));
  }

  return sprint;
}

export type CreateLabelOpts = {
  workspaceId: string;
  name: string;
  colorKey?: (typeof schema.label.$inferInsert)["colorKey"];
};

export async function createLabel(
  opts: CreateLabelOpts,
): Promise<typeof schema.label.$inferSelect> {
  const { db } = openTestDb();

  const [lbl] = await db
    .insert(schema.label)
    .values({
      workspaceId: opts.workspaceId,
      name: opts.name,
      colorKey: opts.colorKey ?? "blue",
    })
    .returning();

  if (!lbl) throw new Error("Failed to create label");
  return lbl;
}

export type CreateInvitationOpts = {
  workspaceId: string;
  createdById: string;
  email: string;
  token: string;
  expiresAt?: Date;
};

export async function createInvitation(
  opts: CreateInvitationOpts,
): Promise<typeof schema.workspaceInvitation.$inferSelect> {
  const { db } = openTestDb();

  const [inv] = await db
    .insert(schema.workspaceInvitation)
    .values({
      workspaceId: opts.workspaceId,
      createdById: opts.createdById,
      email: opts.email,
      token: opts.token,
      expiresAt: opts.expiresAt ?? new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
    })
    .returning();

  if (!inv) throw new Error("Failed to create invitation");
  return inv;
}

export type CreateUserOpts = {
  email: string;
  password: string;
  name: string;
  workspaceId?: string;
  teamId?: string;
};

export async function createUser(opts: CreateUserOpts): Promise<typeof schema.user.$inferSelect> {
  const { db } = openTestDb();

  const passwordHash = await Bun.password.hash(opts.password, {
    algorithm: "argon2id",
    memoryCost: 8192,
    timeCost: 1,
  });

  const now = new Date();
  const [user] = await db
    .insert(schema.user)
    .values({
      name: opts.name,
      email: opts.email,
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

  if (opts.workspaceId) {
    await db.insert(schema.workspaceUser).values({
      workspaceId: opts.workspaceId,
      userId: user.id,
    });
  }

  if (opts.teamId) {
    await db.insert(schema.userTeam).values({
      userId: user.id,
      teamId: opts.teamId,
    });
  }

  return user;
}

export type CreateWorkspaceOpts = {
  slug: string;
  displayName: string;
  ownerId: string;
  teamKey?: string;
  teamName?: string;
};

export async function createWorkspace(opts: CreateWorkspaceOpts): Promise<{
  workspace: typeof schema.workspace.$inferSelect;
  team: typeof schema.team.$inferSelect;
}> {
  const { db } = openTestDb();

  const [workspace] = await db
    .insert(schema.workspace)
    .values({ slug: opts.slug, displayName: opts.displayName })
    .returning();

  if (!workspace) throw new Error("Failed to create workspace");

  await db.insert(schema.workspaceUser).values({
    workspaceId: workspace.id,
    userId: opts.ownerId,
  });

  const [team] = await db
    .insert(schema.team)
    .values({
      key: opts.teamKey ?? "TMP",
      name: opts.teamName ?? "Default",
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
    userId: opts.ownerId,
    teamId: team.id,
  });

  return { workspace, team };
}

export { textDoc, emptyDoc };
