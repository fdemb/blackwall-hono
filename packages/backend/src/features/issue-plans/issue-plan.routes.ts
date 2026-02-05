import { Hono } from "hono";
import { describeRoute, resolver, validator } from "hono-openapi";
import { z } from "zod";
import { issuePlanService } from "./issue-plan.service";
import type { AppEnv } from "../../lib/hono-env";
import { authMiddleware } from "../auth/auth-middleware";
import { workspaceMiddleware } from "../workspaces/workspace-middleware";
import { teamData } from "../teams/team.data";
import { issueData } from "../issues/issue.data";
import {
  createIssuePlanSchema,
  completeIssuePlanSchema,
  updateIssuePlanSchema,
  issuePlanListSchema,
  issuePlanResponseSchema,
  issuePlanWithIssuesSchema,
} from "./issue-plan.zod";
import { NotFoundError } from "../../lib/errors";

const issuePlanRoutes = new Hono<AppEnv>()
  .use("*", authMiddleware)
  .use("*", workspaceMiddleware)
  /**
   * GET /teams/:teamKey/plans - List all plans for a team.
   */
  .get(
    "/teams/:teamKey/plans",
    describeRoute({
      tags: ["Plans"],
      summary: "List all plans for a team",
      responses: {
        200: {
          description: "List of plans",
          content: { "application/json": { schema: resolver(issuePlanListSchema) } },
        },
      },
    }),
    validator("param", z.object({ teamKey: z.string() })),
    async (c) => {
      const workspace = c.get("workspace");
      const user = c.get("user")!;
      const { teamKey } = c.req.valid("param");

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
    },
  )
  /**
   * GET /teams/:teamKey/plans/active - Get the active plan for a team.
   */
  .get(
    "/teams/:teamKey/plans/active",
    describeRoute({
      tags: ["Plans"],
      summary: "Get active plan for a team",
      responses: {
        200: {
          description: "Active plan",
          content: { "application/json": { schema: resolver(issuePlanResponseSchema) } },
        },
      },
    }),
    validator("param", z.object({ teamKey: z.string() })),
    async (c) => {
      const workspace = c.get("workspace");
      const user = c.get("user")!;
      const { teamKey } = c.req.valid("param");

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
    },
  )
  /**
   * GET /teams/:teamKey/plans/:planId - Get a plan by its id with associated issues.
   */
  .get(
    "/teams/:teamKey/plans/:planId",
    describeRoute({
      tags: ["Plans"],
      summary: "Get a plan by id",
      responses: {
        200: {
          description: "Plan details with issues",
          content: { "application/json": { schema: resolver(issuePlanWithIssuesSchema) } },
        },
      },
    }),
    validator("param", z.object({ teamKey: z.string(), planId: z.string() })),
    async (c) => {
      const workspace = c.get("workspace");
      const user = c.get("user")!;
      const { teamKey, planId } = c.req.valid("param");

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
    },
  )
  /**
   * POST /teams/:teamKey/plans - Create a new plan and set it as active.
   */
  .post(
    "/teams/:teamKey/plans",
    describeRoute({
      tags: ["Plans"],
      summary: "Create a new plan",
      responses: {
        201: {
          description: "Created plan",
          content: { "application/json": { schema: resolver(issuePlanResponseSchema) } },
        },
      },
    }),
    validator("param", z.object({ teamKey: z.string() })),
    validator("json", createIssuePlanSchema),
    async (c) => {
      const workspace = c.get("workspace");
      const user = c.get("user")!;
      const { teamKey } = c.req.valid("param");
      const body = c.req.valid("json");

      const team = await teamData.getTeamForUser({
        workspaceId: workspace.id,
        teamKey,
        userId: user.id,
      });

      if (!team) {
        throw new NotFoundError("Team not found");
      }

      const startDate = new Date(body.startDate);
      startDate.setUTCHours(0, 0, 0, 0);
      const endDate = new Date(body.endDate);
      endDate.setUTCHours(23, 59, 59, 999);

      const plan = await issuePlanService.createAndActivatePlan({
        name: body.name,
        goal: body.goal,
        startDate,
        endDate,
        createdById: user.id,
        teamId: team.id,
        activePlanId: team.activePlanId,
        onUndoneIssues: body.onUndoneIssues,
      });

      return c.json({ plan }, 201);
    },
  )
  /**
   * PATCH /teams/:teamKey/plans/:planId - Update an existing plan.
   */
  .patch(
    "/teams/:teamKey/plans/:planId",
    describeRoute({
      tags: ["Plans"],
      summary: "Update a plan",
      responses: {
        200: {
          description: "Updated plan",
          content: { "application/json": { schema: resolver(issuePlanResponseSchema) } },
        },
      },
    }),
    validator("param", z.object({ teamKey: z.string(), planId: z.string() })),
    validator("json", updateIssuePlanSchema),
    async (c) => {
      const workspace = c.get("workspace");
      const user = c.get("user")!;
      const { teamKey, planId } = c.req.valid("param");
      const body = c.req.valid("json");

      const team = await teamData.getTeamForUser({
        workspaceId: workspace.id,
        teamKey,
        userId: user.id,
      });

      if (!team) {
        throw new NotFoundError("Team not found");
      }

      const startDate = new Date(body.startDate);
      startDate.setUTCHours(0, 0, 0, 0);
      const endDate = new Date(body.endDate);
      endDate.setUTCHours(23, 59, 59, 999);

      const plan = await issuePlanService.updatePlan({
        planId,
        teamId: team.id,
        name: body.name,
        goal: body.goal,
        startDate,
        endDate,
      });

      return c.json({ plan });
    },
  )
  /**
   * POST /teams/:teamKey/plans/:planId/complete - Mark a plan as completed.
   */
  .post(
    "/teams/:teamKey/plans/:planId/complete",
    describeRoute({
      tags: ["Plans"],
      summary: "Complete a plan",
      responses: {
        200: {
          description: "Success",
          content: { "application/json": { schema: resolver(z.object({ success: z.boolean() })) } },
        },
      },
    }),
    validator("param", z.object({ teamKey: z.string(), planId: z.string() })),
    validator("json", completeIssuePlanSchema),
    async (c) => {
      const workspace = c.get("workspace");
      const user = c.get("user")!;
      const { teamKey, planId } = c.req.valid("param");
      const body = c.req.valid("json");

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
        onUndoneIssues: body.onUndoneIssues,
      });

      return c.json({ success: true });
    },
  );

  /**
   * DELETE /teams/:teamKey/plans/:planId - Delete a non-active plan.
   */
  .delete(
    "/teams/:teamKey/plans/:planId",
    describeRoute({
      tags: ["Plans"],
      summary: "Delete a plan",
      responses: {
        200: {
          description: "Success",
          content: { "application/json": { schema: resolver(z.object({ success: z.boolean() })) } },
        },
      },
    }),
    validator("param", z.object({ teamKey: z.string(), planId: z.string() })),
    async (c) => {
      const workspace = c.get("workspace");
      const user = c.get("user")!;
      const { teamKey, planId } = c.req.valid("param");

      const team = await teamData.getTeamForUser({
        workspaceId: workspace.id,
        teamKey,
        userId: user.id,
      });

      if (!team) {
        throw new NotFoundError("Team not found");
      }

      await issuePlanService.deletePlan({
        planId,
        teamId: team.id,
        activePlanId: team.activePlanId,
      });

      return c.json({ success: true });
    },
  );

export { issuePlanRoutes };
