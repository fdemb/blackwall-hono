import { and, eq, inArray, sql } from "drizzle-orm";
import { db, dbSchema } from "@blackwall/database";
import type { IssueStatus } from "@blackwall/database/schema";

const ACTIVE_ISSUE_STATUSES = ["to_do", "in_progress"] as IssueStatus[];

export async function listPlansForTeam(input: { teamId: string }) {
    return db.query.issuePlan.findMany({
        where: { teamId: input.teamId },
        orderBy: { createdAt: "desc" },
    });
}

export async function getPlanById(input: { planId: string; teamId: string }) {
    return db.query.issuePlan.findFirst({
        where: {
            id: input.planId,
            teamId: input.teamId,
        },
    });
}

export async function createPlan(input: {
    name: string;
    goal: string | null;
    startDate: Date;
    endDate: Date;
    createdById: string;
    teamId: string;
}) {
    const [result] = await db
        .insert(dbSchema.issuePlan)
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

export async function updatePlan(input: {
    planId: string;
    name: string;
    goal: string | null;
    startDate: Date;
    endDate: Date;
}) {
    const [result] = await db
        .update(dbSchema.issuePlan)
        .set({
            name: input.name,
            goal: input.goal,
            startDate: input.startDate,
            endDate: input.endDate,
        })
        .where(eq(dbSchema.issuePlan.id, input.planId))
        .returning();

    return result;
}

export async function completePlan(input: { planId: string }) {
    await db
        .update(dbSchema.issuePlan)
        .set({ finishedAt: sql`(unixepoch() * 1000)` })
        .where(eq(dbSchema.issuePlan.id, input.planId));
}

export async function setActivePlanOnTeam(input: {
    teamId: string;
    planId: string | null;
}) {
    await db
        .update(dbSchema.team)
        .set({ activePlanId: input.planId })
        .where(eq(dbSchema.team.id, input.teamId));
}

export async function moveActiveIssuesToBacklog(input: { teamId: string; planId?: string }) {
    const whereConditions = input.planId
        ? and(
            eq(dbSchema.issue.planId, input.planId),
            inArray(dbSchema.issue.status, ACTIVE_ISSUE_STATUSES),
        )
        : and(
            eq(dbSchema.issue.teamId, input.teamId),
            inArray(dbSchema.issue.status, ACTIVE_ISSUE_STATUSES),
        );

    await db
        .update(dbSchema.issue)
        .set({
            planId: null,
            status: "backlog",
        })
        .where(whereConditions);
}

export async function moveActiveIssuesToPlan(input: {
    teamId: string;
    fromPlanId?: string;
    toPlanId: string;
}) {
    const whereConditions = input.fromPlanId
        ? and(
            eq(dbSchema.issue.planId, input.fromPlanId),
            inArray(dbSchema.issue.status, ACTIVE_ISSUE_STATUSES),
        )
        : and(
            eq(dbSchema.issue.teamId, input.teamId),
            inArray(dbSchema.issue.status, ACTIVE_ISSUE_STATUSES),
        );

    await db
        .update(dbSchema.issue)
        .set({ planId: input.toPlanId })
        .where(whereConditions);
}

export async function moveActiveIssuesToUnplanned(input: { teamId: string; planId?: string }) {
    const whereConditions = input.planId
        ? and(
            eq(dbSchema.issue.planId, input.planId),
            inArray(dbSchema.issue.status, ACTIVE_ISSUE_STATUSES),
        )
        : and(
            eq(dbSchema.issue.teamId, input.teamId),
            inArray(dbSchema.issue.status, ACTIVE_ISSUE_STATUSES),
        );

    await db
        .update(dbSchema.issue)
        .set({ planId: null })
        .where(whereConditions);
}

export async function clearPlanFromIssues(input: { planId: string }) {
    await db
        .update(dbSchema.issue)
        .set({ planId: null })
        .where(eq(dbSchema.issue.planId, input.planId));
}

export async function deletePlan(input: { planId: string }) {
    await db.delete(dbSchema.issuePlan).where(eq(dbSchema.issuePlan.id, input.planId));
}

export const issuePlanData = {
    listPlansForTeam,
    getPlanById,
    createPlan,
    updatePlan,
    completePlan,
    setActivePlanOnTeam,
    moveActiveIssuesToBacklog,
    moveActiveIssuesToPlan,
    moveActiveIssuesToUnplanned,
    clearPlanFromIssues,
    deletePlan,
};
