import { describeRoute, resolver, validator } from "hono-openapi";
import { z } from "zod";
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
  jobStatsResponseSchema,
  jobListSchema,
  jobResponseSchema,
  recoverStaleResponseSchema,
} from "./job.zod";

const jobRoutes = new Hono<AppEnv>()
  .use("*", authMiddleware)
  /**
   * GET /stats - Get job queue statistics.
   */
  .get(
    "/stats",
    describeRoute({
      tags: ["Jobs"],
      summary: "Get job stats",
      responses: {
        200: {
          description: "Job statistics",
          content: { "application/json": { schema: resolver(jobStatsResponseSchema) } },
        },
      },
    }),
    validator("query", jobStatsQuerySchema),
    async (c) => {
      const { queue } = c.req.valid("query");
      const stats = await jobService.getJobStats(queue);
      return c.json({ stats });
    },
  )
  /**
   * GET / - List jobs with optional filters.
   */
  .get(
    "/",
    describeRoute({
      tags: ["Jobs"],
      summary: "List jobs",
      responses: {
        200: {
          description: "List of jobs",
          content: { "application/json": { schema: resolver(jobListSchema) } },
        },
      },
    }),
    validator("query", listJobsQuerySchema),
    async (c) => {
      const { queue, status, limit } = c.req.valid("query");
      const jobs = await jobService.listJobs({ queue, status, limit });
      return c.json({ jobs });
    },
  )
  /**
   * GET /:id - Get a job by its id.
   */
  .get(
    "/:id",
    describeRoute({
      tags: ["Jobs"],
      summary: "Get a job by id",
      responses: {
        200: {
          description: "Job details",
          content: { "application/json": { schema: resolver(jobResponseSchema) } },
        },
        404: { description: "Job not found" },
      },
    }),
    validator("param", jobParamsSchema),
    async (c) => {
      const { id } = c.req.valid("param");
      const job = await jobService.getJobById(id);
      if (!job) {
        return c.notFound();
      }
      return c.json({ job });
    },
  )
  /**
   * POST / - Create a new job.
   */
  .post(
    "/",
    describeRoute({
      tags: ["Jobs"],
      summary: "Create a job",
      responses: {
        201: {
          description: "Created job",
          content: { "application/json": { schema: resolver(jobResponseSchema) } },
        },
      },
    }),
    validator("json", createJobSchema),
    async (c) => {
      const input = c.req.valid("json");
      const job = await jobService.addJob(input);
      return c.json({ job }, 201);
    },
  )
  /**
   * POST /recover-stale - Recover stale jobs that were locked but never completed.
   */
  .post(
    "/recover-stale",
    describeRoute({
      tags: ["Jobs"],
      summary: "Recover stale jobs",
      responses: {
        200: {
          description: "Recovery count",
          content: { "application/json": { schema: resolver(recoverStaleResponseSchema) } },
        },
      },
    }),
    async (c) => {
      const count = await jobService.recoverStaleJobs();
      return c.json({ recovered: count });
    },
  )
  /**
   * POST /cleanup - Clean up old completed and failed jobs.
   */
  .post(
    "/cleanup",
    describeRoute({
      tags: ["Jobs"],
      summary: "Cleanup old jobs",
      responses: {
        200: {
          description: "Success",
          content: { "application/json": { schema: resolver(z.object({ success: z.boolean() })) } },
        },
      },
    }),
    validator("json", cleanupJobsSchema),
    async (c) => {
      const opts = c.req.valid("json");
      await jobService.cleanupJobs(opts);
      return c.json({ success: true });
    },
  );

export { jobRoutes };
