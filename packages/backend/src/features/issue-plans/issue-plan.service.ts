import { issuePlanData } from "./issue-plan.data";
import { teamData } from "../teams/team.data";
import { BadRequestError, NotFoundError } from "../../lib/errors";

/**
 * List all plans for a team.
 * @param input team id
 * @returns list of issue plans
 */
async function listPlans(input: { teamId: string }) {
    return issuePlanData.listPlansForTeam({ teamId: input.teamId });
}

/**
 * Get a plan by its id.
 * @param input plan id and team id
 * @returns issue plan
 * @throws NotFoundError if plan not found
 */
async function getPlanById(input: { planId: string; teamId: string }) {
    const plan = await issuePlanData.getPlanById(input);
    if (!plan) {
        throw new NotFoundError("Issue plan not found");
    }
    return plan;
}

/**
 * Get the active plan for a team.
 * @param input team id and active plan id
 * @returns active plan or null
 */
async function getActivePlan(input: { teamId: string; activePlanId: string | null }) {
    if (!input.activePlanId) {
        return null;
    }
    return issuePlanData.getPlanById({ planId: input.activePlanId, teamId: input.teamId });
}

/**
 * Create a new plan and set it as the active plan for the team.
 * Handles moving undone issues from the previous plan.
 * @param input plan details, team id, and strategy for undone issues
 * @returns newly created plan
 */
async function createAndActivatePlan(input: {
    name: string;
    goal: string | null;
    startDate: Date;
    endDate: Date;
    createdById: string;
    teamId: string;
    activePlanId: string | null;
    onUndoneIssues: "moveToBacklog" | "moveToNewPlan";
}) {
    const plan = await issuePlanData.createPlan({
        name: input.name,
        goal: input.goal,
        startDate: input.startDate,
        endDate: input.endDate,
        createdById: input.createdById,
        teamId: input.teamId,
    });

    if (input.activePlanId) {
        if (input.onUndoneIssues === "moveToBacklog") {
            await issuePlanData.moveActiveIssuesToBacklog({
                teamId: input.teamId,
                planId: input.activePlanId,
            });
        } else {
            await issuePlanData.moveActiveIssuesToPlan({
                teamId: input.teamId,
                fromPlanId: input.activePlanId,
                toPlanId: plan.id,
            });
        }
    } else {
        if (input.onUndoneIssues === "moveToBacklog") {
            await issuePlanData.moveActiveIssuesToBacklog({
                teamId: input.teamId,
            });
        } else {
            await issuePlanData.moveActiveIssuesToPlan({
                teamId: input.teamId,
                toPlanId: plan.id,
            });
        }
    }

    await issuePlanData.setActivePlanOnTeam({
        teamId: input.teamId,
        planId: plan.id,
    });

    return plan;
}

/**
 * Update an existing plan.
 * @param input plan id, team id, and updated fields
 * @returns updated plan
 * @throws NotFoundError if plan not found
 * @throws BadRequestError if plan is already completed
 */
async function updatePlan(input: {
    planId: string;
    teamId: string;
    name: string;
    goal: string | null;
    startDate: Date;
    endDate: Date;
}) {
    const plan = await issuePlanData.getPlanById({
        planId: input.planId,
        teamId: input.teamId,
    });

    if (!plan) {
        throw new NotFoundError("Issue plan not found");
    }

    if (plan.finishedAt) {
        throw new BadRequestError("Cannot update completed plan");
    }

    return issuePlanData.updatePlan({
        planId: input.planId,
        name: input.name,
        goal: input.goal,
        startDate: input.startDate,
        endDate: input.endDate,
    });
}

/**
 * Mark a plan as completed and clear the active plan from the team.
 * @param input plan id and team id
 * @throws NotFoundError if plan not found
 * @throws BadRequestError if plan is already completed
 */
async function completePlan(input: { planId: string; teamId: string }) {
    const plan = await issuePlanData.getPlanById({
        planId: input.planId,
        teamId: input.teamId,
    });

    if (!plan) {
        throw new NotFoundError("Issue plan not found");
    }

    if (plan.finishedAt) {
        throw new BadRequestError("Plan already completed");
    }

    await issuePlanData.completePlan({ planId: input.planId });
    await issuePlanData.setActivePlanOnTeam({ teamId: input.teamId, planId: null });
}

export const issuePlanService = {
    listPlans,
    getPlanById,
    getActivePlan,
    createAndActivatePlan,
    updatePlan,
    completePlan,
};
