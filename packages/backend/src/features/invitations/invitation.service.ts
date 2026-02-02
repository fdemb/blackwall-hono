import { env } from "../../lib/zod-env";
import { jobService } from "../jobs/job.service";
import { workspaceData } from "../workspaces/workspace.data";
import { invitationData } from "./invitation.data";

async function createInvitation(input: {
  workspaceId: string;
  inviterId: string;
  inviterName: string;
  email: string;
}) {
  const workspace = await workspaceData.getWorkspaceById(input.workspaceId);

  if (!workspace) {
    throw new Error("Workspace not found");
  }

  const invitation = await invitationData.createInvitation({
    workspaceId: input.workspaceId,
    createdById: input.inviterId,
    email: input.email,
  });

  if (!invitation) {
    throw new Error("Failed to create invitation");
  }

  const invitationUrl = `${env.APP_BASE_URL}/invite/${invitation.token}`;

  await jobService.addJob({
    type: "invite-email",
    queue: "email",
    payload: {
      email: input.email,
      workspaceName: workspace.displayName,
      inviterName: input.inviterName,
      invitationUrl,
    },
  });

  return {
    invitation,
    invitationUrl,
  };
}

async function getInvitationByToken(token: string) {
  const invitation = await invitationData.getInvitationByToken(token);

  if (!invitation) {
    return null;
  }

  if (invitation.expiresAt && invitation.expiresAt < new Date()) {
    return null;
  }

  return invitation;
}

async function acceptInvitation(input: { token: string; userId: string }) {
  const invitation = await getInvitationByToken(input.token);

  if (!invitation) {
    throw new Error("Invitation not found or expired");
  }

  await workspaceData.addUserToWorkspace({
    userId: input.userId,
    workspaceId: invitation.workspaceId,
  });

  return { workspaceSlug: invitation.workspace.slug };
}

async function deleteInvitation(invitationId: string) {
  await invitationData.deleteInvitation(invitationId);
}

export const invitationService = {
  createInvitation,
  getInvitationByToken,
  acceptInvitation,
  deleteInvitation,
};
