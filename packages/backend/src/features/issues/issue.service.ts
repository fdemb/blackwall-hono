import type { IssueStatus } from "@blackwall/database/schema";
import { teamData } from "../teams/team.data";
import { issueData, type CreateIssueInput, type UpdateIssueInput } from "./issue.data";
import { ForbiddenError, NotFoundError } from "../../lib/errors";

/**
 * Get a team for user or throw an error if not found.
 * @param input workspace id, team key, and user id
 * @returns team data
 * @throws NotFoundError if team not found or access denied
 */
async function getTeamForUserOrThrow(input: {
  workspaceId: string;
  teamKey: string;
  userId: string;
}) {
  const team = await teamData.getTeamForUser(input);

  if (!team) {
    throw new NotFoundError("Team not found or access denied");
  }

  return team;
}

/**
 * Get an issue by its key. Validates user access to the team.
 * @param input workspace id, issue key, and user id
 * @returns issue data with relations
 * @throws NotFoundError if issue not found or access denied
 */
async function getIssueByKey(input: { workspaceId: string; issueKey: string; userId: string }) {
  const issue = await issueData.getIssueByKey({
    workspaceId: input.workspaceId,
    issueKey: input.issueKey,
  });

  if (!issue || !issue.team) {
    throw new NotFoundError("Issue not found");
  }

  await getTeamForUserOrThrow({
    workspaceId: input.workspaceId,
    teamKey: issue.team.key,
    userId: input.userId,
  });

  return issue;
}

/**
 * List issues for a team with optional filters.
 * @param input workspace id, team key, user id, and optional filters
 * @returns list of issues
 */
async function listIssuesForTeam(input: {
  workspaceId: string;
  teamKey: string;
  userId: string;
  statusFilters?: IssueStatus[];
  onlyOnActiveSprint?: boolean;
}) {
  const team = await getTeamForUserOrThrow({
    workspaceId: input.workspaceId,
    teamKey: input.teamKey,
    userId: input.userId,
  });

  if (input.onlyOnActiveSprint && team.activeSprintId) {
    return issueData.listIssuesInSprint({
      workspaceId: input.workspaceId,
      teamId: team.id,
      sprintId: team.activeSprintId,
      statusFilters: input.statusFilters,
    });
  }

  return issueData.listIssuesInTeam({
    workspaceId: input.workspaceId,
    teamId: team.id,
    statusFilters: input.statusFilters,
  });
}

/**
 * List all issues assigned to the current user.
 * @param input workspace id and user id
 * @returns list of issues assigned to the user
 */
async function listIssuesAssignedToUser(input: { workspaceId: string; userId: string }) {
  return issueData.listIssuesAssignedToUser({
    workspaceId: input.workspaceId,
    userId: input.userId,
  });
}

/**
 * Create a new issue in a team.
 * @param input workspace id, team key, user id, and issue data
 * @returns created issue
 */
async function createIssue(input: {
  workspaceId: string;
  teamKey: string;
  userId: string;
  issue: CreateIssueInput;
}) {
  const team = await getTeamForUserOrThrow({
    workspaceId: input.workspaceId,
    teamKey: input.teamKey,
    userId: input.userId,
  });

  return issueData.createIssue({
    workspaceId: input.workspaceId,
    teamId: team.id,
    teamKey: team.key,
    createdById: input.userId,
    issue: input.issue,
  });
}

/**
 * Update an existing issue.
 * @param input workspace id, issue key, user id, and updates
 * @returns updated issue
 */
async function updateIssue(input: {
  workspaceId: string;
  issueKey: string;
  userId: string;
  updates: UpdateIssueInput;
}) {
  const issue = await getIssueByKey({
    workspaceId: input.workspaceId,
    issueKey: input.issueKey,
    userId: input.userId,
  });

  return issueData.updateIssue({
    issueId: issue.id,
    workspaceId: input.workspaceId,
    actorId: input.userId,
    updates: input.updates,
    originalIssue: issue,
  });
}

/**
 * Update multiple issues at once.
 * @param input workspace id, issue ids, user id, and updates
 * @returns updated issues
 * @throws ForbiddenError if some issues are not accessible to the user
 */
async function updateIssuesBulk(input: {
  workspaceId: string;
  issueIds: string[];
  userId: string;
  updates: UpdateIssueInput;
}) {
  const userTeams = await teamData.listUserTeams({
    workspaceId: input.workspaceId,
    userId: input.userId,
  });

  const userTeamIds = userTeams.map((team) => team.id);

  const issues = await issueData.getIssuesByIds({
    workspaceId: input.workspaceId,
    issueIds: input.issueIds,
  });

  const issuesInUserTeams = issues.filter((issue) => userTeamIds.includes(issue.teamId));

  if (issuesInUserTeams.length !== input.issueIds.length) {
    throw new ForbiddenError("Some issues are not accessible to the current user");
  }

  return issueData.updateIssuesBulk({
    issueIds: input.issueIds,
    workspaceId: input.workspaceId,
    actorId: input.userId,
    updates: input.updates,
  });
}

/**
 * Soft delete an issue by its key.
 * @param input workspace id, issue key, and user id
 */
async function deleteIssue(input: { workspaceId: string; issueKey: string; userId: string }) {
  const issue = await getIssueByKey({
    workspaceId: input.workspaceId,
    issueKey: input.issueKey,
    userId: input.userId,
  });

  await issueData.softDeleteIssue({ issueId: issue.id });
}

/**
 * Soft delete multiple issues at once.
 * @param input workspace id, issue ids, and user id
 * @returns deleted issues
 * @throws ForbiddenError if some issues are not accessible to the user
 */
async function softDeleteIssuesBulk(input: {
  workspaceId: string;
  issueIds: string[];
  userId: string;
}) {
  const userTeams = await teamData.listUserTeams({
    workspaceId: input.workspaceId,
    userId: input.userId,
  });

  const userTeamIds = userTeams.map((team) => team.id);

  const issues = await issueData.getIssuesByIds({
    workspaceId: input.workspaceId,
    issueIds: input.issueIds,
  });

  const issuesInUserTeams = issues.filter((issue) => userTeamIds.includes(issue.teamId));

  if (issuesInUserTeams.length !== input.issueIds.length) {
    throw new ForbiddenError("Some issues are not accessible to the current user");
  }

  return issueData.softDeleteIssuesBulk({
    issueIds: input.issueIds,
    workspaceId: input.workspaceId,
    actorId: input.userId,
  });
}

export const issueService = {
  getIssueByKey,
  listIssuesForTeam,
  listIssuesAssignedToUser,
  createIssue,
  updateIssue,
  deleteIssue,
  updateIssuesBulk,
  softDeleteIssuesBulk,
};
