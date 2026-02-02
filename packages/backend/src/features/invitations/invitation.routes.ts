import { zValidator } from "../../lib/validator";
import { Hono } from "hono";
import type { AppEnv } from "../../lib/hono-env";
import { invitationService } from "./invitation.service";
import { auth } from "../auth/better-auth";
import { workspaceData } from "../workspaces/workspace.data";
import {
  createInvitationSchema,
  invitationTokenParamsSchema,
  registerAndAcceptInvitationSchema,
} from "./invitation.zod";
import { HTTPException } from "hono/http-exception";

const invitationRoutes = new Hono<AppEnv>().post(
  "/",
  zValidator("json", createInvitationSchema),
  async (c) => {
    const workspace = c.get("workspace");
    const user = c.get("user")!;
    const { email } = c.req.valid("json");

    const result = await invitationService.createInvitation({
      workspaceId: workspace.id,
      inviterId: user.id,
      inviterName: user.name,
      email,
    });

    return c.json({
      message: "Invitation sent successfully.",
      invitation: result.invitation,
      invitationUrl: result.invitationUrl,
    });
  },
);

const publicInvitationRoutes = new Hono<AppEnv>()
  .get("/:token", zValidator("param", invitationTokenParamsSchema), async (c) => {
    const { token } = c.req.valid("param");

    const invitation = await invitationService.getInvitationByToken(token);

    if (!invitation) {
      throw new HTTPException(404, { message: "Invitation not found or expired" });
    }

    return c.json({
      invitation: {
        email: invitation.email,
        workspace: {
          displayName: invitation.workspace.displayName,
          slug: invitation.workspace.slug,
        },
      },
    });
  })
  .post(
    "/:token/register",
    zValidator("param", invitationTokenParamsSchema),
    zValidator("json", registerAndAcceptInvitationSchema),
    async (c) => {
      const { token } = c.req.valid("param");
      const { name, password } = c.req.valid("json");

      const invitation = await invitationService.getInvitationByToken(token);

      if (!invitation) {
        throw new HTTPException(404, { message: "Invitation not found or expired" });
      }

      const { response, headers } = await auth.api.signUpEmail({
        body: {
          email: invitation.email,
          name,
          password,
        },
        headers: c.req.header(),
        returnHeaders: true,
      });

      await workspaceData.addUserToWorkspace({
        userId: response.user.id,
        workspaceId: invitation.workspaceId,
      });

      const setCookie = headers.get("Set-Cookie");
      if (setCookie) {
        c.header("Set-Cookie", setCookie);
      }

      return c.json({
        user: response.user,
        workspaceSlug: invitation.workspace.slug,
      });
    },
  );

const protectedInvitationRoutes = new Hono<AppEnv>().post(
  "/:token/accept",
  zValidator("param", invitationTokenParamsSchema),
  async (c) => {
    const user = c.get("user")!;
    const { token } = c.req.valid("param");

    const result = await invitationService.acceptInvitation({
      token,
      userId: user.id,
    });

    return c.json({
      message: "Invitation accepted successfully.",
      workspaceSlug: result.workspaceSlug,
    });
  },
);

export { invitationRoutes, publicInvitationRoutes, protectedInvitationRoutes };
