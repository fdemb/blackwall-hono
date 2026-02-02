import { Hono } from "hono";
import { zValidator } from "../../lib/validator";
import { issuePlanService } from "./issue-plan.service";
import type { AppEnv } from "../../lib/hono-env";
import { teamData } from "../teams/team.data";
import { issueData } from "../issues/issue.data";
import { createIssuePlanSchema, updateIssuePlanSchema } from "./issue-plan.zod";
import { NotFoundError } from "../../lib/errors";

const issuePlanRoutes = new Hono<AppEnv>()
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
