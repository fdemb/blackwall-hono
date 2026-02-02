import type { Workspace } from "../../db/schema";
import { teamData } from "./team.data";
import { ForbiddenError, NotFoundError } from "../../lib/errors";

/**
 * Create a new team. Anyone can do this operation.
 * @param input name, key and workspace id for the new team
 * @returns the newly created team
 */
async function createTeam(input: { name: string; key: string; workspaceId: string }) {
  return teamData.createTeam(input);
}

/**
 * Create a new team based on an existing workspace.
 * @param input workspace object containing displayName and id
 * @returns the newly created team
 */
async function createTeamBasedOnWorkspace(input: {
  workspace: Pick<Workspace, "displayName" | "id">;
}) {
  const key = input.workspace.displayName.split(" ").join("").slice(0, 3).toUpperCase();
  return teamData.createTeam({
    name: input.workspace.displayName,
    workspaceId: input.workspace.id,
    key,
  });
}

/**
 * Add a user to a team. Permissions aren't checked.
 * @param input team id and user id
 */
async function UNCHECKED_addUserToTeam(input: { teamId: string; userId: string }) {
  return teamData.addUserToTeam(input);
}

/**
 * Add a user to a team. Permissions are checked.
 * @param input team id and user id
 */
async function addUserToTeam(input: { actorId: string; teamId: string; userId: string }) {
  const isMember = await teamData.isTeamMember({
    userId: input.actorId,
    teamId: input.teamId,
  });
  if (!isMember) {
    throw new ForbiddenError("Current user is not a member of the team");
  }

  return teamData.addUserToTeam(input);
}

async function getTeams(input: { workspaceId: string }) {
  return teamData.getTeams(input);
}

async function getTeamByKey(input: { workspaceId: string; teamKey: string; userId: string }) {
  const team = await teamData.getTeamForUser(input);
  if (!team) {
    throw new NotFoundError("Team not found or you are not a member");
  }
  return team;
}

async function listTeamUsers(input: { workspaceId: string; teamKey: string; userId: string }) {
  const isMember = await teamData.getTeamForUser({
    workspaceId: input.workspaceId,
    teamKey: input.teamKey,
    userId: input.userId,
  });
  if (!isMember) {
    throw new ForbiddenError("You are not a member of this team");
  }
  return teamData.listTeamUsers(input);
}

async function getPreferredTeam(input: { workspaceId: string; userId: string }) {
  return teamData.getPreferredTeamForUser(input);
}

async function listTeamsWithActivePlans(input: { workspaceId: string; userId: string }) {
  return teamData.listUserTeams(input);
}

export const teamService = {
  createTeam,
  createTeamBasedOnWorkspace,
  addUserToTeam,
  UNCHECKED_addUserToTeam,
  getTeams,
  getTeamByKey,
  listTeamUsers,
  getPreferredTeam,
  listTeamsWithActivePlans,
};
