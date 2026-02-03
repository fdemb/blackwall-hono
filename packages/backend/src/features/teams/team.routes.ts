import { Hono } from "hono";
import { zValidator } from "../../lib/validator";
import { teamService } from "./team.service";
import type { AppEnv } from "../../lib/hono-env";
import { createTeamSchema, teamParamsSchema } from "./team.zod";

const teamRoutes = new Hono<AppEnv>()
  /**
   * POST /create - Create a new team in the workspace.
   */
  .post("/create", zValidator("json", createTeamSchema), async (c) => {
    const validated = c.req.valid("json");
    const team = await teamService.createTeam(validated);

    return c.json({ team: team });
  })
  /**
   * GET / - List all teams in the workspace.
   */
  .get("/", async (c) => {
    const workspace = c.get("workspace");
    const teams = await teamService.getTeams({ workspaceId: workspace.id });

    return c.json({ teams });
  })
  /**
   * GET /preferred - Get the user's preferred team for the workspace.
   */
  .get("/preferred", async (c) => {
    const workspace = c.get("workspace");
    const user = c.get("user")!;
    const team = await teamService.getPreferredTeam({
      workspaceId: workspace.id,
      userId: user.id,
    });

    return c.json({ team });
  })
  /**
   * GET /with-active-plans - List teams the user belongs to that have active plans.
   */
  .get("/with-active-plans", async (c) => {
    const workspace = c.get("workspace");
    const user = c.get("user")!;
    const teams = await teamService.listTeamsWithActivePlans({
      workspaceId: workspace.id,
      userId: user.id,
    });

    return c.json({ teams });
  })
  /**
   * GET /:teamKey - Get a team by its key.
   */
  .get("/:teamKey", zValidator("param", teamParamsSchema), async (c) => {
    const workspace = c.get("workspace");
    const user = c.get("user")!;
    const { teamKey } = c.req.valid("param");

    const team = await teamService.getTeamByKey({
      workspaceId: workspace.id,
      teamKey,
      userId: user.id,
    });

    return c.json({ team });
  })
  /**
   * GET /:teamKey/users - List all users in a team.
   */
  .get("/:teamKey/users", zValidator("param", teamParamsSchema), async (c) => {
    const workspace = c.get("workspace");
    const user = c.get("user")!;
    const { teamKey } = c.req.valid("param");

    const users = await teamService.listTeamUsers({
      workspaceId: workspace.id,
      teamKey,
      userId: user.id,
    });

    return c.json({ users });
  });

export { teamRoutes };
