import { Hono } from "hono";
import { zValidator } from "../../lib/validator";
import { timeEntryService } from "./time-entry.service";
import { issueService } from "../issues/issue.service";
import type { AppEnv } from "../../lib/hono-env";
import { createTimeEntrySchema } from "./time-entry.zod";

const timeEntryRoutes = new Hono<AppEnv>()
  .get("/issues/:issueKey/time-entries", async (c) => {
    const workspace = c.get("workspace");
    const user = c.get("user")!;
    const { issueKey } = c.req.param();

    const issue = await issueService.getIssueByKey({
      workspaceId: workspace.id,
      issueKey,
      userId: user.id,
    });

    const entries = await timeEntryService.listTimeEntriesForIssue({
      issueId: issue.id,
    });

    return c.json({ entries });
  })
  .get("/issues/:issueKey/time-entries/total", async (c) => {
    const workspace = c.get("workspace");
    const user = c.get("user")!;
    const { issueKey } = c.req.param();

    const issue = await issueService.getIssueByKey({
      workspaceId: workspace.id,
      issueKey,
      userId: user.id,
    });

    const totalMinutes = await timeEntryService.getTotalTimeLoggedForIssue({
      issueId: issue.id,
    });

    return c.json({ totalMinutes });
  })
  .post("/issues/:issueKey/time-entries", zValidator("json", createTimeEntrySchema), async (c) => {
    const workspace = c.get("workspace");
    const user = c.get("user")!;
    const { issueKey } = c.req.param();
    const body = c.req.valid("json");

    const issue = await issueService.getIssueByKey({
      workspaceId: workspace.id,
      issueKey,
      userId: user.id,
    });

    const entry = await timeEntryService.createTimeEntry({
      issueId: issue.id,
      workspaceId: workspace.id,
      userId: user.id,
      duration: body.duration,
      description: body.description,
    });

    return c.json({ entry }, 201);
  })
  .delete("/issues/:issueKey/time-entries/:timeEntryId", async (c) => {
    const workspace = c.get("workspace");
    const user = c.get("user")!;
    const { issueKey, timeEntryId } = c.req.param();

    const issue = await issueService.getIssueByKey({
      workspaceId: workspace.id,
      issueKey,
      userId: user.id,
    });

    await timeEntryService.deleteTimeEntry({
      timeEntryId,
      issueId: issue.id,
      userId: user.id,
    });

    return c.json({ success: true });
  });

export { timeEntryRoutes };
