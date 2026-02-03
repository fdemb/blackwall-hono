import { Hono } from "hono";
import { zValidator } from "../../lib/validator";
import { z } from "zod";
import { issueService } from "./issue.service";
import { labelService } from "./label.service";
import type { AppEnv } from "../../lib/hono-env";
import { authMiddleware } from "../auth/auth-middleware";
import { workspaceMiddleware } from "../workspaces/workspace-middleware";
import {
  listIssuesQuerySchema,
  createIssueSchema,
  issueParamsSchema,
  updateIssueSchema,
  bulkUpdateIssuesSchema,
  bulkDeleteIssuesSchema,
} from "./issue.zod";

const issueRoutes = new Hono<AppEnv>()
  .use("*", authMiddleware)
  .use("*", workspaceMiddleware)
  /**
   * GET / - List issues for a team with optional filters.
   */
  .get("/", zValidator("query", listIssuesQuerySchema), async (c) => {
    const workspace = c.get("workspace");
    const user = c.get("user")!;
    const { teamKey, statusFilters, onlyOnActivePlan } = c.req.valid("query");

    const issues = await issueService.listIssuesForTeam({
      workspaceId: workspace.id,
      teamKey,
      userId: user.id,
      statusFilters,
      onlyOnActivePlan,
    });

    return c.json({ issues });
  })
  /**
   * POST / - Create a new issue.
   */
  .post("/", zValidator("json", createIssueSchema), async (c) => {
    const workspace = c.get("workspace");
    const user = c.get("user")!;
    const { teamKey, issue } = c.req.valid("json");

    const created = await issueService.createIssue({
      workspaceId: workspace.id,
      teamKey,
      userId: user.id,
      issue,
    });

    return c.json({ issue: created });
  })
  /**
   * GET /my - List all issues assigned to the current user.
   */
  .get("/my", async (c) => {
    const workspace = c.get("workspace");
    const user = c.get("user")!;

    const issues = await issueService.listIssuesAssignedToUser({
      workspaceId: workspace.id,
      userId: user.id,
    });

    return c.json({ issues });
  })
  /**
   * GET /:issueKey - Get an issue by its key.
   */
  .get("/:issueKey", zValidator("param", issueParamsSchema), async (c) => {
    const workspace = c.get("workspace");
    const user = c.get("user")!;
    const { issueKey } = c.req.valid("param");

    const issue = await issueService.getIssueByKey({
      workspaceId: workspace.id,
      issueKey,
      userId: user.id,
    });

    return c.json({ issue });
  })
  /**
   * PATCH /bulk - Update multiple issues at once.
   */
  .patch("/bulk", zValidator("json", bulkUpdateIssuesSchema), async (c) => {
    const workspace = c.get("workspace");
    const user = c.get("user")!;
    const { issueIds, updates } = c.req.valid("json");

    const updated = await issueService.updateIssuesBulk({
      workspaceId: workspace.id,
      issueIds,
      userId: user.id,
      updates,
    });

    return c.json({ issues: updated });
  })
  /**
   * PATCH /:issueKey - Update an existing issue.
   */
  .patch(
    "/:issueKey",
    zValidator("param", issueParamsSchema),
    zValidator("json", updateIssueSchema),
    async (c) => {
      const workspace = c.get("workspace");
      const user = c.get("user")!;
      const { issueKey } = c.req.valid("param");
      const updates = c.req.valid("json");

      const updated = await issueService.updateIssue({
        workspaceId: workspace.id,
        issueKey,
        userId: user.id,
        updates,
      });

      return c.json({ issue: updated });
    },
  )
  /**
   * DELETE /bulk - Soft delete multiple issues at once.
   */
  .delete("/bulk", zValidator("json", bulkDeleteIssuesSchema), async (c) => {
    const workspace = c.get("workspace");
    const user = c.get("user")!;
    const { issueIds } = c.req.valid("json");

    const issues = await issueService.softDeleteIssuesBulk({
      workspaceId: workspace.id,
      issueIds,
      userId: user.id,
    });

    return c.json({ message: `${issues.length} issues deleted` });
  })
  /**
   * DELETE /:issueKey - Soft delete an issue.
   */
  .delete("/:issueKey", zValidator("param", issueParamsSchema), async (c) => {
    const workspace = c.get("workspace");
    const user = c.get("user")!;
    const { issueKey } = c.req.valid("param");

    await issueService.deleteIssue({
      workspaceId: workspace.id,
      issueKey,
      userId: user.id,
    });

    return c.json({ message: "Issue deleted" });
  })
  /**
   * POST /:issueKey/labels - Add a label to an issue.
   */
  .post(
    "/:issueKey/labels",
    zValidator("param", issueParamsSchema),
    zValidator("json", z.object({ labelId: z.string() })),
    async (c) => {
      const workspace = c.get("workspace");
      const user = c.get("user")!;
      const { issueKey } = c.req.valid("param");
      const { labelId } = c.req.valid("json");

      const issue = await issueService.getIssueByKey({
        workspaceId: workspace.id,
        issueKey,
        userId: user.id,
      });

      await labelService.addLabelToIssue({
        issueId: issue.id,
        labelId,
        workspaceId: workspace.id,
        actorId: user.id,
      });

      return c.json({ success: true });
    },
  )
  /**
   * DELETE /:issueKey/labels/:labelId - Remove a label from an issue.
   */
  .delete(
    "/:issueKey/labels/:labelId",
    zValidator("param", issueParamsSchema.extend({ labelId: z.string() })),
    async (c) => {
      const workspace = c.get("workspace");
      const user = c.get("user")!;
      const { issueKey, labelId } = c.req.valid("param");

      const issue = await issueService.getIssueByKey({
        workspaceId: workspace.id,
        issueKey,
        userId: user.id,
      });

      await labelService.removeLabelFromIssue({
        issueId: issue.id,
        labelId,
        workspaceId: workspace.id,
        actorId: user.id,
      });

      return c.json({ success: true });
    },
  );

export { issueRoutes };
