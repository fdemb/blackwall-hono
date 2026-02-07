import { and, eq, inArray, sql } from "drizzle-orm";
import { db, dbSchema } from "@blackwall/database";
import type { IssueStatus } from "@blackwall/database/schema";

const ACTIVE_ISSUE_STATUSES = ["to_do", "in_progress"] as IssueStatus[];

export async function listSprintsForTeam(input: { teamId: string }) {
    return db.query.issueSprint.findMany({
        where: { teamId: input.teamId },
        orderBy: { createdAt: "desc" },
    });
}

export async function getSprintById(input: { sprintId: string; teamId: string }) {
    return db.query.issueSprint.findFirst({
        where: {
            id: input.sprintId,
            teamId: input.teamId,
        },
    });
}

export async function createSprint(input: {
    name: string;
    goal: string | null;
    startDate: Date;
    endDate: Date;
    createdById: string;
    teamId: string;
}) {
    const [result] = await db
        .insert(dbSchema.issueSprint)
        .values({
            name: input.name,
            goal: input.goal,
            startDate: input.startDate,
            endDate: input.endDate,
            createdById: input.createdById,
            teamId: input.teamId,
        })
        .returning();

    return result;
}

export async function updateSprint(input: {
    sprintId: string;
    name: string;
    goal: string | null;
    startDate: Date;
    endDate: Date;
}) {
    const [result] = await db
        .update(dbSchema.issueSprint)
        .set({
            name: input.name,
            goal: input.goal,
            startDate: input.startDate,
            endDate: input.endDate,
        })
        .where(eq(dbSchema.issueSprint.id, input.sprintId))
        .returning();

    return result;
}

export async function completeSprint(input: { sprintId: string }) {
    await db
        .update(dbSchema.issueSprint)
        .set({ finishedAt: sql`(unixepoch() * 1000)` })
        .where(eq(dbSchema.issueSprint.id, input.sprintId));
}

export async function setActiveSprintOnTeam(input: {
    teamId: string;
    sprintId: string | null;
}) {
    await db
        .update(dbSchema.team)
        .set({ activeSprintId: input.sprintId })
        .where(eq(dbSchema.team.id, input.teamId));
}

export async function moveActiveIssuesToBacklog(input: { teamId: string; sprintId?: string }) {
    const whereConditions = input.sprintId
        ? and(
            eq(dbSchema.issue.sprintId, input.sprintId),
            inArray(dbSchema.issue.status, ACTIVE_ISSUE_STATUSES),
        )
        : and(
            eq(dbSchema.issue.teamId, input.teamId),
            inArray(dbSchema.issue.status, ACTIVE_ISSUE_STATUSES),
        );

    await db
        .update(dbSchema.issue)
        .set({
            sprintId: null,
            status: "backlog",
        })
        .where(whereConditions);
}

export async function moveActiveIssuesToSprint(input: {
    teamId: string;
    fromSprintId?: string;
    toSprintId: string;
}) {
    const whereConditions = input.fromSprintId
        ? and(
            eq(dbSchema.issue.sprintId, input.fromSprintId),
            inArray(dbSchema.issue.status, ACTIVE_ISSUE_STATUSES),
        )
        : and(
            eq(dbSchema.issue.teamId, input.teamId),
            inArray(dbSchema.issue.status, ACTIVE_ISSUE_STATUSES),
        );

    await db
        .update(dbSchema.issue)
        .set({ sprintId: input.toSprintId })
        .where(whereConditions);
}

export async function moveActiveIssuesToUnsprinted(input: { teamId: string; sprintId?: string }) {
    const whereConditions = input.sprintId
        ? and(
            eq(dbSchema.issue.sprintId, input.sprintId),
            inArray(dbSchema.issue.status, ACTIVE_ISSUE_STATUSES),
        )
        : and(
            eq(dbSchema.issue.teamId, input.teamId),
            inArray(dbSchema.issue.status, ACTIVE_ISSUE_STATUSES),
        );

    await db
        .update(dbSchema.issue)
        .set({ sprintId: null })
        .where(whereConditions);
}

export async function clearSprintFromIssues(input: { sprintId: string }) {
    await db
        .update(dbSchema.issue)
        .set({ sprintId: null })
        .where(eq(dbSchema.issue.sprintId, input.sprintId));
}

export async function deleteSprint(input: { sprintId: string }) {
    await db.delete(dbSchema.issueSprint).where(eq(dbSchema.issueSprint.id, input.sprintId));
}

export const issueSprintData = {
    listSprintsForTeam,
    getSprintById,
    createSprint,
    updateSprint,
    completeSprint,
    setActiveSprintOnTeam,
    moveActiveIssuesToBacklog,
    moveActiveIssuesToSprint,
    moveActiveIssuesToUnsprinted,
    clearSprintFromIssues,
    deleteSprint,
};
