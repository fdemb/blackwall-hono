import { eq, inArray } from "drizzle-orm";
import { db, dbSchema } from "@blackwall/database";
import type { Issue, IssueStatus, NewIssue } from "@blackwall/database/schema";
import { getNextSequenceNumber } from "./key-sequences";
import { buildChangeEvent, buildIssueUpdatedEvent } from "./change-events";

export async function listIssuesInTeam(input: {
  workspaceId: string;
  teamId: string;
  statusFilters?: IssueStatus[];
  withoutSprint?: boolean;
}) {
  return db.query.issue.findMany({
    where: {
      workspaceId: input.workspaceId,
      teamId: input.teamId,
      deletedAt: { isNull: true },
      status: input.statusFilters ? { in: input.statusFilters } : undefined,
      sprintId: input.withoutSprint ? { isNull: true } : undefined,
    },
    with: {
      assignedTo: true,
      labels: true,
      issueSprint: true,
      team: true,
    },
  });
}

export async function listIssuesInSprint(input: {
  workspaceId: string;
  teamId: string;
  sprintId: string;
  statusFilters?: IssueStatus[];
}) {
  return db.query.issue.findMany({
    where: {
      workspaceId: input.workspaceId,
      teamId: input.teamId,
      sprintId: input.sprintId,
      deletedAt: { isNull: true },
      status: input.statusFilters ? { in: input.statusFilters } : undefined,
    },
    with: {
      assignedTo: true,
      labels: true,
      issueSprint: true,
      team: true,
    },
  });
}

export async function listIssuesAssignedToUser(input: {
  workspaceId: string;
  userId: string;
}) {
  return db.query.issue.findMany({
    where: {
      workspaceId: input.workspaceId,
      assignedToId: input.userId,
      deletedAt: { isNull: true },
    },
    with: {
      assignedTo: true,
      labels: true,
      issueSprint: true,
      team: true, // Need team info for display often
    },
  });
}

export type CreateIssueInput = Pick<
  NewIssue,
  "summary" | "description" | "status" | "assignedToId" | "sprintId"
>;

export async function createIssue(input: {
  workspaceId: string;
  teamId: string;
  teamKey: string;
  createdById: string;
  issue: CreateIssueInput;
}) {
  const result = await db.transaction(async (tx) => {
    const keyNumber = await getNextSequenceNumber({
      workspaceId: input.workspaceId,
      teamId: input.teamId,
      tx,
    });

    const [issue] = await tx
      .insert(dbSchema.issue)
      .values({
        ...input.issue,
        createdById: input.createdById,
        assignedToId: input.issue.assignedToId ?? undefined,
        keyNumber,
        key: `${input.teamKey}-${keyNumber}`,
        teamId: input.teamId,
        workspaceId: input.workspaceId,
      })
      .returning();

    await tx.insert(dbSchema.issueChangeEvent).values(
      buildChangeEvent(
        {
          issueId: issue.id,
          workspaceId: input.workspaceId,
          actorId: input.createdById,
        },
        "issue_created",
      ),
    );

    return issue;
  });

  if (!result) {
    throw new Error("Issue couldn't be created.");
  }

  return result;
}

export async function getIssueById(input: { issueId: string }) {
  return db.query.issue.findFirst({
    where: {
      id: input.issueId,
      deletedAt: { isNull: true },
    },
    with: {
      assignedTo: true,
      labels: true,
      issueSprint: true,
      team: {
        with: {
          activeSprint: true,
        },
      },
      comments: {
        where: { deletedAt: { isNull: true } },
        orderBy: { id: "asc" },
        with: {
          author: true,
        },
      },
      changeEvents: {
        orderBy: { createdAt: "asc" },
        with: {
          actor: true,
        },
      },
    },
  });
}

export async function getIssueByKey(input: { workspaceId: string; issueKey: string }) {
  return db.query.issue.findFirst({
    where: {
      workspaceId: input.workspaceId,
      key: input.issueKey,
      deletedAt: { isNull: true },
    },
    with: {
      assignedTo: true,
      labels: true,
      issueSprint: true,
      team: {
        with: {
          activeSprint: true,
        },
      },
      comments: {
        where: { deletedAt: { isNull: true } },
        orderBy: { id: "asc" },
        with: {
          author: true,
        },
      },
      changeEvents: {
        orderBy: { createdAt: "asc" },
        with: {
          actor: true,
        },
      },
    },
  });
}

export async function getIssuesByIds(input: { issueIds: string[], workspaceId: string }) {
  return db.query.issue.findMany({
    where: {
      id: { in: input.issueIds },
      workspaceId: input.workspaceId,
      deletedAt: { isNull: true },
    },
  });
}

export type UpdateIssueInput = Partial<
  Pick<
    NewIssue,
    "summary" | "description" | "status" | "priority" | "assignedToId" | "sprintId" | "estimationPoints" | "order"
  >
>;

export async function updateIssue(input: {
  issueId: string;
  workspaceId: string;
  actorId: string;
  updates: UpdateIssueInput;
  originalIssue: Issue;
}) {
  const result = await db.transaction(async (tx) => {
    const [updated] = await tx
      .update(dbSchema.issue)
      .set(input.updates)
      .where(eq(dbSchema.issue.id, input.issueId))
      .returning();

    const event = buildIssueUpdatedEvent(
      {
        issueId: input.issueId,
        workspaceId: input.workspaceId,
        actorId: input.actorId,
      },
      input.updates,
      input.originalIssue,
    );

    if (event) {
      await tx.insert(dbSchema.issueChangeEvent).values(event);
    }

    return updated;
  });

  return result;
}

export async function updateIssuesBulk(input: {
  issueIds: string[];
  workspaceId: string;
  actorId: string;
  updates: UpdateIssueInput;
}) {
  const issues = await getIssuesByIds(input);

  const result = await db.transaction(async (tx) => {
    const [updated] = await tx
      .update(dbSchema.issue)
      .set(input.updates)
      .where(inArray(dbSchema.issue.id, input.issueIds))
      .returning();

    const events = issues.map((issue) => {
      return buildIssueUpdatedEvent(
        {
          issueId: issue.id,
          workspaceId: input.workspaceId,
          actorId: input.actorId,
        },
        input.updates,
        issue,
      )
    }).filter((event) => event !== null);

    if (events.length > 0) {
      await tx.insert(dbSchema.issueChangeEvent).values(events);
    }

    return updated;
  });

  return result;
}

export async function softDeleteIssuesBulk(input: {
  issueIds: string[];
  workspaceId: string;
  actorId: string;
}) {
  const result = await db.transaction(async (tx) => {
    const updated = await tx
      .update(dbSchema.issue)
      .set({ deletedAt: new Date() })
      .where(inArray(dbSchema.issue.id, input.issueIds))
      .returning();

    return updated;
  });

  return result;
}

export async function softDeleteIssue(input: { issueId: string }) {
  await db
    .update(dbSchema.issue)
    .set({ deletedAt: new Date() })
    .where(eq(dbSchema.issue.id, input.issueId));
}

export const issueData = {
  listIssuesInTeam,
  listIssuesInSprint,
  listIssuesAssignedToUser,
  createIssue,
  getIssueById,
  getIssueByKey,
  updateIssue,
  softDeleteIssue,
  getIssuesByIds,
  updateIssuesBulk,
  softDeleteIssuesBulk,
};
