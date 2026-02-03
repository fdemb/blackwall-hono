import { Hono } from "hono";
import { zValidator } from "../../lib/validator";
import type { AppEnv } from "../../lib/hono-env";
import { settingsService } from "./settings.service";
import {
  updateProfileNameSchema,
  changePasswordSchema,
  updateWorkspaceSettingsSchema,
  teamKeyParamSchema,
  updateTeamSchema,
  addTeamMemberSchema,
  removeTeamMemberParamSchema,
  createTeamSettingsSchema,
} from "./settings.zod";
import { workspaceService } from "../workspaces/workspace.service";
import { HTTPException } from "hono/http-exception";
import { teamData } from "../teams/team.data";
import { teamService } from "../teams/team.service";

const settingsRoutes = new Hono<AppEnv>()
  /**
   * GET /profile - Get the current user's profile.
   */
  .get("/profile", async (c) => {
    const user = c.get("user")!;
    const profile = await settingsService.getProfile(user.id);

    if (!profile) {
      return c.notFound();
    }

    return c.json({ profile });
  })
  /**
   * PATCH /profile - Update the current user's profile name.
   */
  .patch("/profile", zValidator("json", updateProfileNameSchema), async (c) => {
    const user = c.get("user")!;
    const { name } = c.req.valid("json");

    const profile = await settingsService.updateProfileName({
      userId: user.id,
      name,
    });

    return c.json({ profile });
  })
  /**
   * PATCH /profile/avatar - Update or remove the current user's avatar.
   */
  .patch("/profile/avatar", async (c) => {
    const user = c.get("user")!;
    const formData = await c.req.formData();
    const intent = formData.get("intent") as string | null;
    const file = formData.get("file") as File | null;

    const currentUser = await settingsService.getProfile(user.id);
    if (!currentUser) {
      throw new HTTPException(404, { message: "User not found" });
    }

    if (intent === "remove") {
      const profile = await settingsService.updateProfileAvatar({
        userId: user.id,
        image: null,
        currentImage: currentUser.image,
      });

      return c.json({ profile });
    }

    if (!file || file.size === 0) {
      throw new HTTPException(400, { message: "No avatar file provided" });
    }

    if (!file.type.startsWith("image/")) {
      throw new HTTPException(400, { message: "Only image files are supported" });
    }

    const MAX_AVATAR_FILE_SIZE = 5 * 1024 * 1024;
    if (file.size > MAX_AVATAR_FILE_SIZE) {
      throw new HTTPException(400, { message: "Image must be smaller than 5MB" });
    }

    const bytes = await file.arrayBuffer();
    const base64 = Buffer.from(bytes).toString("base64");
    const dataUrl = `data:${file.type};base64,${base64}`;

    const profile = await settingsService.updateProfileAvatar({
      userId: user.id,
      image: dataUrl,
      currentImage: currentUser.image,
    });

    return c.json({ profile });
  })
  /**
   * POST /profile/password - Change the current user's password.
   */
  .post("/profile/password", zValidator("json", changePasswordSchema), async (c) => {
    const { currentPassword, newPassword, revokeOtherSessions } = c.req.valid("json");

    try {
      await settingsService.changePassword({
        headers: c.req.raw.headers,
        currentPassword,
        newPassword,
        revokeOtherSessions,
      });

      return c.json({ success: true });
    } catch (error) {
      throw new HTTPException(400, { message: "Failed to change password" });
    }
  })
  /**
   * GET /workspace - Get the current workspace settings.
   */
  .get("/workspace", async (c) => {
    const workspace = c.get("workspace");

    return c.json({ workspace });
  })
  /**
   * PATCH /workspace - Update the current workspace settings.
   */
  .patch("/workspace", zValidator("json", updateWorkspaceSettingsSchema), async (c) => {
    const user = c.get("user")!;
    const workspace = c.get("workspace");
    const { displayName } = c.req.valid("json");

    if (displayName) {
      const updatedWorkspace = await workspaceService.updateWorkspace({
        actorId: user.id,
        workspaceId: workspace.id,
        displayName,
      });

      return c.json({ workspace: updatedWorkspace });
    }

    return c.json({ workspace });
  })
  /**
   * GET /teams - List all teams in the workspace with member counts.
   */
  .get("/teams", async (c) => {
    const workspace = c.get("workspace");
    const teamsData = await teamData.listTeamsWithCounts({ workspaceId: workspace.id });
    return c.json({ teams: teamsData });
  })
  /**
   * POST /teams - Create a new team in the workspace.
   */
  .post("/teams", zValidator("json", createTeamSettingsSchema), async (c) => {
    const workspace = c.get("workspace");
    const user = c.get("user")!;
    const { name, key } = c.req.valid("json");

    const team = await teamService.createTeam({
      name,
      key,
      workspaceId: workspace.id,
    });

    await teamService.UNCHECKED_addUserToTeam({
      teamId: team.id,
      userId: user.id,
    });

    return c.json({ team });
  })
  /**
   * GET /teams/:teamKey - Get a team by its key with members.
   */
  .get("/teams/:teamKey", zValidator("param", teamKeyParamSchema), async (c) => {
    const workspace = c.get("workspace");
    const { teamKey } = c.req.valid("param");

    const team = await teamData.getTeamByKey({
      workspaceId: workspace.id,
      teamKey,
    });

    if (!team) {
      throw new HTTPException(404, { message: "Team not found" });
    }

    const teamMembers = await teamData.listTeamUsers({
      workspaceId: workspace.id,
      teamKey,
    });

    return c.json({ team, teamMembers });
  })
  /**
   * PATCH /teams/:teamKey - Update a team's settings.
   */
  .patch(
    "/teams/:teamKey",
    zValidator("param", teamKeyParamSchema),
    zValidator("json", updateTeamSchema),
    async (c) => {
      const workspace = c.get("workspace");
      const { teamKey } = c.req.valid("param");
      const updates = c.req.valid("json");

      const team = await teamData.updateTeam({
        workspaceId: workspace.id,
        teamKey,
        updates,
      });

      if (!team) {
        throw new HTTPException(404, { message: "Team not found" });
      }

      return c.json({ team });
    },
  )
  /**
   * GET /teams/:teamKey/available-users - List workspace users not in a team.
   */
  .get("/teams/:teamKey/available-users", zValidator("param", teamKeyParamSchema), async (c) => {
    const workspace = c.get("workspace");
    const { teamKey } = c.req.valid("param");

    const users = await teamData.listWorkspaceUsersNotInTeam({
      workspaceId: workspace.id,
      teamKey,
    });

    return c.json({ users });
  })
  /**
   * POST /teams/:teamKey/members - Add a member to a team.
   */
  .post(
    "/teams/:teamKey/members",
    zValidator("param", teamKeyParamSchema),
    zValidator("json", addTeamMemberSchema),
    async (c) => {
      const workspace = c.get("workspace");
      const user = c.get("user")!;
      const { teamKey } = c.req.valid("param");
      const { userId } = c.req.valid("json");

      const team = await teamData.getTeamByKey({
        workspaceId: workspace.id,
        teamKey,
      });

      if (!team) {
        throw new HTTPException(404, { message: "Team not found" });
      }

      await teamService.addUserToTeam({
        actorId: user.id,
        teamId: team.id,
        userId,
      });

      return c.json({ success: true });
    },
  )
  /**
   * DELETE /teams/:teamKey/members/:userId - Remove a member from a team.
   */
  .delete(
    "/teams/:teamKey/members/:userId",
    zValidator("param", removeTeamMemberParamSchema),
    async (c) => {
      const workspace = c.get("workspace");
      const { teamKey, userId } = c.req.valid("param");

      const team = await teamData.getTeamByKey({
        workspaceId: workspace.id,
        teamKey,
      });

      if (!team) {
        throw new HTTPException(404, { message: "Team not found" });
      }

      await teamData.removeUserFromTeam({
        teamId: team.id,
        userId,
      });

      return c.json({ success: true });
    },
  );

export { settingsRoutes };
