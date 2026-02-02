import { zValidator } from "../../lib/validator";
import { Hono } from "hono";
import type { AppEnv } from "../../lib/hono-env";
import { jobService } from "./job.service";
import {
  jobStatsQuerySchema,
  listJobsQuerySchema,
  jobParamsSchema,
  createJobSchema,
  cleanupJobsSchema,
} from "./job.zod";

const jobRoutes = new Hono<AppEnv>()
  .get("/stats", zValidator("query", jobStatsQuerySchema), async (c) => {
    const { queue } = c.req.valid("query");
    const stats = await jobService.getJobStats(queue);
    return c.json({ stats });
  })
  .get("/", zValidator("query", listJobsQuerySchema), async (c) => {
    const { queue, status, limit } = c.req.valid("query");
    const jobs = await jobService.listJobs({ queue, status, limit });
    return c.json({ jobs });
  })
  .get("/:id", zValidator("param", jobParamsSchema), async (c) => {
    const { id } = c.req.valid("param");
    const job = await jobService.getJobById(id);
    if (!job) {
      return c.notFound();
    }
    return c.json({ job });
  })
  .post("/", zValidator("json", createJobSchema), async (c) => {
    const input = c.req.valid("json");
    const job = await jobService.addJob(input);
    return c.json({ job }, 201);
  })
  .post("/recover-stale", async (c) => {
    const count = await jobService.recoverStaleJobs();
    return c.json({ recovered: count });
  })
  .post("/cleanup", zValidator("json", cleanupJobsSchema), async (c) => {
    const opts = c.req.valid("json");
    await jobService.cleanupJobs(opts);
    return c.json({ success: true });
  });

export { jobRoutes };
