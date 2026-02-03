import { zValidator } from "../../lib/validator";
import { Hono } from "hono";
import type { AppEnv } from "../../lib/hono-env";
import { workspaceService } from "./workspace.service";
import {
  createWorkspaceSchema,
  updateWorkspaceSchema,
  workspaceIdParamsSchema,
  workspaceSlugParamsSchema,
  workspaceMemberParamsSchema,
} from "./workspace.zod";
import { HTTPException } from "hono/http-exception";

const workspaceRoutes = new Hono<AppEnv>()
  /**
   * GET / - List all workspaces the user belongs to.
   */
  .get("/", async (c) => {
    const workspaces = await workspaceService.listUserWorkspaces({
      userId: c.get("user")!.id,
    });

    return c.json({ workspaces });
  })

  /**
   * POST /create - Create a new workspace.
   */
  .post("/create", zValidator("json", createWorkspaceSchema), async (c) => {
    const workspace = await workspaceService.createWorkspace(c.req.valid("json"));

    return c.json({ workspace });
  })

  /**
   * GET /preferred - Get the user's preferred workspace.
   */
  .get("/preferred", async (c) => {
    const user = c.get("user")!;
    const workspace = await workspaceService.getPreferredWorkspaceForUser({ user });

    return c.json({ workspace });
  })

  /**
   * GET /:slug - Get a workspace by its slug.
   */
  .get("/:slug", async (c) => {
    const { slug } = c.req.param();
    const user = c.get("user")!;

    const workspace = await workspaceService.getWorkspaceBySlug(slug, user.id);

    return c.json({ workspace: workspace });
  })

  /**
   * PATCH /:workspaceId - Update a workspace's settings.
   */
  .patch(
    "/:workspaceId",
    zValidator("param", workspaceIdParamsSchema),
    zValidator("json", updateWorkspaceSchema),
    async (c) => {
      const user = c.get("user")!;
      const { workspaceId } = c.req.valid("param");
      const { displayName } = c.req.valid("json");

      const workspace = await workspaceService.updateWorkspace({
        actorId: user.id,
        workspaceId,
        displayName,
      });

      return c.json({ workspace });
    },
  )

  /**
   * GET /:slug/members - List all members of a workspace.
   */
  .get("/:slug/members", zValidator("param", workspaceSlugParamsSchema), async (c) => {
    const user = c.get("user")!;
    const { slug } = c.req.valid("param");
    const workspace = await workspaceService.getWorkspaceBySlug(slug, user.id);

    const members = await workspaceService.listWorkspaceMembers({
      actorId: user.id,
      workspaceId: workspace.id,
    });

    return c.json({ members });
  })

  /**
   * GET /:slug/members/:userId - Get a specific member of a workspace.
   */
  .get("/:slug/members/:userId", zValidator("param", workspaceMemberParamsSchema), async (c) => {
    const user = c.get("user")!;
    const { slug, userId } = c.req.valid("param");
    const workspace = await workspaceService.getWorkspaceBySlug(slug, user.id);

    const member = await workspaceService.getWorkspaceMember({
      actorId: user.id,
      workspaceId: workspace.id,
      userId,
    });

    if (!member) {
      throw new HTTPException(404, { message: "Member not found" });
    }

    return c.json({ member });
  });

export { workspaceRoutes };
