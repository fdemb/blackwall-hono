import type { IssueStatus } from "../../db/schema";
import { teamData } from "../teams/team.data";
import { issueData, type CreateIssueInput, type UpdateIssueInput } from "./issue.data";
import { ForbiddenError, NotFoundError } from "../../lib/errors";

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

async function listIssuesForTeam(input: {
  workspaceId: string;
  teamKey: string;
  userId: string;
  statusFilters?: IssueStatus[];
  onlyOnActivePlan?: boolean;
}) {
  const team = await getTeamForUserOrThrow({
    workspaceId: input.workspaceId,
    teamKey: input.teamKey,
    userId: input.userId,
  });

  if (input.onlyOnActivePlan && team.activePlanId) {
    return issueData.listIssuesInPlan({
      workspaceId: input.workspaceId,
      teamId: team.id,
      planId: team.activePlanId,
      statusFilters: input.statusFilters,
    });
  }

  return issueData.listIssuesInTeam({
    workspaceId: input.workspaceId,
    teamId: team.id,
    statusFilters: input.statusFilters,
  });
}

async function listIssuesAssignedToUser(input: { workspaceId: string; userId: string }) {
  return issueData.listIssuesAssignedToUser({
    workspaceId: input.workspaceId,
    userId: input.userId,
  });
}

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

async function deleteIssue(input: { workspaceId: string; issueKey: string; userId: string }) {
  const issue = await getIssueByKey({
    workspaceId: input.workspaceId,
    issueKey: input.issueKey,
    userId: input.userId,
  });

  await issueData.softDeleteIssue({ issueId: issue.id });
}

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
