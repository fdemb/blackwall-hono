import { issueSprintData } from "./issue-sprint.data";
import { teamData } from "../teams/team.data";
import { BadRequestError, NotFoundError } from "../../lib/errors";

/**
 * List all sprints for a team.
 * @param input team id
 * @returns list of issue sprints
 */
async function listSprints(input: { teamId: string }) {
    return issueSprintData.listSprintsForTeam({ teamId: input.teamId });
}

/**
 * Get a sprint by its id.
 * @param input sprint id and team id
 * @returns issue sprint
 * @throws NotFoundError if sprint not found
 */
async function getSprintById(input: { sprintId: string; teamId: string }) {
    const sprint = await issueSprintData.getSprintById(input);
    if (!sprint) {
        throw new NotFoundError("Issue sprint not found");
    }
    return sprint;
}

/**
 * Get the active sprint for a team.
 * @param input team id and active sprint id
 * @returns active sprint or null
 */
async function getActiveSprint(input: { teamId: string; activeSprintId: string | null }) {
    if (!input.activeSprintId) {
        return null;
    }
    return issueSprintData.getSprintById({ sprintId: input.activeSprintId, teamId: input.teamId });
}

/**
 * Create a new sprint and set it as the active sprint for the team.
 * Handles moving undone issues from the previous sprint.
 * @param input sprint details, team id, and strategy for undone issues
 * @returns newly created sprint
 */
async function createAndActivateSprint(input: {
    name: string;
    goal: string | null;
    startDate: Date;
    endDate: Date;
    createdById: string;
    teamId: string;
    activeSprintId: string | null;
    onUndoneIssues: "moveToBacklog" | "moveToNewSprint";
}) {
    const sprint = await issueSprintData.createSprint({
        name: input.name,
        goal: input.goal,
        startDate: input.startDate,
        endDate: input.endDate,
        createdById: input.createdById,
        teamId: input.teamId,
    });

    if (input.activeSprintId) {
        if (input.onUndoneIssues === "moveToBacklog") {
            await issueSprintData.moveActiveIssuesToBacklog({
                teamId: input.teamId,
                sprintId: input.activeSprintId,
            });
        } else {
            await issueSprintData.moveActiveIssuesToSprint({
                teamId: input.teamId,
                fromSprintId: input.activeSprintId,
                toSprintId: sprint.id,
            });
        }
    } else {
        if (input.onUndoneIssues === "moveToBacklog") {
            await issueSprintData.moveActiveIssuesToBacklog({
                teamId: input.teamId,
            });
        } else {
            await issueSprintData.moveActiveIssuesToSprint({
                teamId: input.teamId,
                toSprintId: sprint.id,
            });
        }
    }

    await issueSprintData.setActiveSprintOnTeam({
        teamId: input.teamId,
        sprintId: sprint.id,
    });

    return sprint;
}

/**
 * Update an existing sprint.
 * @param input sprint id, team id, and updated fields
 * @returns updated sprint
 * @throws NotFoundError if sprint not found
 * @throws BadRequestError if sprint is already completed
 */
async function updateSprint(input: {
    sprintId: string;
    teamId: string;
    name: string;
    goal: string | null;
    startDate: Date;
    endDate: Date;
}) {
    const sprint = await issueSprintData.getSprintById({
        sprintId: input.sprintId,
        teamId: input.teamId,
    });

    if (!sprint) {
        throw new NotFoundError("Issue sprint not found");
    }

    if (sprint.finishedAt) {
        throw new BadRequestError("Cannot update completed sprint");
    }

    return issueSprintData.updateSprint({
        sprintId: input.sprintId,
        name: input.name,
        goal: input.goal,
        startDate: input.startDate,
        endDate: input.endDate,
    });
}

/**
 * Mark a sprint as completed and clear the active sprint from the team.
 * @param input sprint id and team id
 * @throws NotFoundError if sprint not found
 * @throws BadRequestError if sprint is already completed
 */
async function completeSprint(input: {
    sprintId: string;
    teamId: string;
    onUndoneIssues: "moveToBacklog" | "moveToNewSprint";
}) {
    const sprint = await issueSprintData.getSprintById({
        sprintId: input.sprintId,
        teamId: input.teamId,
    });

    if (!sprint) {
        throw new NotFoundError("Issue sprint not found");
    }

    if (sprint.finishedAt) {
        throw new BadRequestError("Sprint already completed");
    }

    if (sprint.endDate.getTime() > Date.now()) {
        throw new BadRequestError("Cannot complete sprint before its end date");
    }

    if (input.onUndoneIssues === "moveToBacklog") {
        await issueSprintData.moveActiveIssuesToBacklog({
            teamId: input.teamId,
            sprintId: input.sprintId,
        });
    } else {
        await issueSprintData.moveActiveIssuesToUnsprinted({
            teamId: input.teamId,
            sprintId: input.sprintId,
        });
    }

    await issueSprintData.clearSprintFromIssues({ sprintId: input.sprintId });
    await issueSprintData.completeSprint({ sprintId: input.sprintId });
    await issueSprintData.setActiveSprintOnTeam({ teamId: input.teamId, sprintId: null });
}

/**
 * Delete a non-active sprint and detach its issues.
 * @param input sprint id, team id, and active sprint id
 * @throws NotFoundError if sprint not found
 * @throws BadRequestError if sprint is active
 */
async function deleteSprint(input: {
    sprintId: string;
    teamId: string;
    activeSprintId: string | null;
}) {
    const sprint = await issueSprintData.getSprintById({
        sprintId: input.sprintId,
        teamId: input.teamId,
    });

    if (!sprint) {
        throw new NotFoundError("Issue sprint not found");
    }

    if (input.activeSprintId === input.sprintId) {
        throw new BadRequestError("Cannot delete active sprint");
    }

    await issueSprintData.moveActiveIssuesToBacklog({
        teamId: input.teamId,
        sprintId: input.sprintId,
    });

    await issueSprintData.clearSprintFromIssues({ sprintId: input.sprintId });
    await issueSprintData.deleteSprint({ sprintId: input.sprintId });
}

export const issueSprintService = {
    listSprints,
    getSprintById,
    getActiveSprint,
    createAndActivateSprint,
    updateSprint,
    completeSprint,
    deleteSprint,
};
