import { zValidator } from "../../lib/validator";
import { Hono } from "hono";
import type { AppEnv } from "../../lib/hono-env";
import { authMiddleware } from "../auth/auth-middleware";
import { jobService } from "./job.service";
import {
  jobStatsQuerySchema,
  listJobsQuerySchema,
  jobParamsSchema,
  createJobSchema,
  cleanupJobsSchema,
} from "./job.zod";

const jobRoutes = new Hono<AppEnv>()
  .use("*", authMiddleware)
  /**
   * GET /stats - Get job queue statistics.
   */
  .get("/stats", zValidator("query", jobStatsQuerySchema), async (c) => {
    const { queue } = c.req.valid("query");
    const stats = await jobService.getJobStats(queue);
    return c.json({ stats });
  })
  /**
   * GET / - List jobs with optional filters.
   */
  .get("/", zValidator("query", listJobsQuerySchema), async (c) => {
    const { queue, status, limit } = c.req.valid("query");
    const jobs = await jobService.listJobs({ queue, status, limit });
    return c.json({ jobs });
  })
  /**
   * GET /:id - Get a job by its id.
   */
  .get("/:id", zValidator("param", jobParamsSchema), async (c) => {
    const { id } = c.req.valid("param");
    const job = await jobService.getJobById(id);
    if (!job) {
      return c.notFound();
    }
    return c.json({ job });
  })
  /**
   * POST / - Create a new job.
   */
  .post("/", zValidator("json", createJobSchema), async (c) => {
    const input = c.req.valid("json");
    const job = await jobService.addJob(input);
    return c.json({ job }, 201);
  })
  /**
   * POST /recover-stale - Recover stale jobs that were locked but never completed.
   */
  .post("/recover-stale", async (c) => {
    const count = await jobService.recoverStaleJobs();
    return c.json({ recovered: count });
  })
  /**
   * POST /cleanup - Clean up old completed and failed jobs.
   */
  .post("/cleanup", zValidator("json", cleanupJobsSchema), async (c) => {
    const opts = c.req.valid("json");
    await jobService.cleanupJobs(opts);
    return c.json({ success: true });
  });

export { jobRoutes };
