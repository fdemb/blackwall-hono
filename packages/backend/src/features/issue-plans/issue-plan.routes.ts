import { Hono } from "hono";
import { zValidator } from "../../lib/validator";
import { issuePlanService } from "./issue-plan.service";
import type { AppEnv } from "../../lib/hono-env";
import { teamData } from "../teams/team.data";
import { issueData } from "../issues/issue.data";
import { createIssuePlanSchema, updateIssuePlanSchema } from "./issue-plan.zod";
import { NotFoundError } from "../../lib/errors";

const issuePlanRoutes = new Hono<AppEnv>()
  /**
   * GET /teams/:teamKey/plans - List all plans for a team.
   */
  .get("/teams/:teamKey/plans", async (c) => {
    const workspace = c.get("workspace");
    const user = c.get("user")!;
    const { teamKey } = c.req.param();

    const team = await teamData.getTeamForUser({
      workspaceId: workspace.id,
      teamKey,
      userId: user.id,
    });

    if (!team) {
      throw new NotFoundError("Team not found");
    }

    const plans = await issuePlanService.listPlans({ teamId: team.id });
    return c.json({ plans });
  })
  /**
   * GET /teams/:teamKey/plans/active - Get the active plan for a team.
   */
  .get("/teams/:teamKey/plans/active", async (c) => {
    const workspace = c.get("workspace");
    const user = c.get("user")!;
    const { teamKey } = c.req.param();

    const team = await teamData.getTeamForUser({
      workspaceId: workspace.id,
      teamKey,
      userId: user.id,
    });

    if (!team) {
      throw new NotFoundError("Team not found");
    }

    const plan = await issuePlanService.getActivePlan({
      teamId: team.id,
      activePlanId: team.activePlanId,
    });

    return c.json({ plan });
  })
  /**
   * GET /teams/:teamKey/plans/:planId - Get a plan by its id with associated issues.
   */
  .get("/teams/:teamKey/plans/:planId", async (c) => {
    const workspace = c.get("workspace");
    const user = c.get("user")!;
    const { teamKey, planId } = c.req.param();

    const team = await teamData.getTeamForUser({
      workspaceId: workspace.id,
      teamKey,
      userId: user.id,
    });

    if (!team) {
      throw new NotFoundError("Team not found");
    }

    const plan = await issuePlanService.getPlanById({
      planId,
      teamId: team.id,
    });

    const issues = await issueData.listIssuesInPlan({
      workspaceId: workspace.id,
      teamId: team.id,
      planId,
    });

    return c.json({ plan, issues });
  })
  /**
   * POST /teams/:teamKey/plans - Create a new plan and set it as active.
   */
  .post("/teams/:teamKey/plans", zValidator("json", createIssuePlanSchema), async (c) => {
    const workspace = c.get("workspace");
    const user = c.get("user")!;
    const { teamKey } = c.req.param();
    const body = c.req.valid("json");

    const team = await teamData.getTeamForUser({
      workspaceId: workspace.id,
      teamKey,
      userId: user.id,
    });

    if (!team) {
      throw new NotFoundError("Team not found");
    }

    const plan = await issuePlanService.createAndActivatePlan({
      name: body.name,
      goal: body.goal,
      startDate: body.startDate,
      endDate: body.endDate,
      createdById: user.id,
      teamId: team.id,
      activePlanId: team.activePlanId,
      onUndoneIssues: body.onUndoneIssues,
    });

    return c.json({ plan }, 201);
  })
  /**
   * PATCH /teams/:teamKey/plans/:planId - Update an existing plan.
   */
  .patch("/teams/:teamKey/plans/:planId", zValidator("json", updateIssuePlanSchema), async (c) => {
    const workspace = c.get("workspace");
    const user = c.get("user")!;
    const { teamKey, planId } = c.req.param();
    const body = c.req.valid("json");

    const team = await teamData.getTeamForUser({
      workspaceId: workspace.id,
      teamKey,
      userId: user.id,
    });

    if (!team) {
      throw new NotFoundError("Team not found");
    }

    const plan = await issuePlanService.updatePlan({
      planId,
      teamId: team.id,
      name: body.name,
      goal: body.goal,
      startDate: body.startDate,
      endDate: body.endDate,
    });

    return c.json({ plan });
  })
  /**
   * POST /teams/:teamKey/plans/:planId/complete - Mark a plan as completed.
   */
  .post("/teams/:teamKey/plans/:planId/complete", async (c) => {
    const workspace = c.get("workspace");
    const user = c.get("user")!;
    const { teamKey, planId } = c.req.param();

    const team = await teamData.getTeamForUser({
      workspaceId: workspace.id,
      teamKey,
      userId: user.id,
    });

    if (!team) {
      throw new NotFoundError("Team not found");
    }

    await issuePlanService.completePlan({
      planId,
      teamId: team.id,
    });

    return c.json({ success: true });
  });

export { issuePlanRoutes };
