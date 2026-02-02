import { z } from "zod";
import { jobStatusValues } from "../../db/schema/job.schema";

export const jobStatsQuerySchema = z.object({
    queue: z.string().optional(),
});

export type JobStatsQuery = z.infer<typeof jobStatsQuerySchema>;

export const listJobsQuerySchema = z.object({
    queue: z.string().optional(),
    status: z.enum(jobStatusValues).optional(),
    limit: z.coerce.number().min(1).max(1000).optional(),
});

export type ListJobsQuery = z.infer<typeof listJobsQuerySchema>;

export const jobParamsSchema = z.object({
    id: z.string(),
});

export type JobParams = z.infer<typeof jobParamsSchema>;

export const createJobSchema = z.object({
    type: z.string(),
    payload: z.any(),
    queue: z.string().optional(),
    delay: z.number().optional(),
    maxAttempts: z.number().optional(),
});

export type CreateJob = z.infer<typeof createJobSchema>;

export const cleanupJobsSchema = z.object({
    completedOlderThanMs: z.number().optional(),
    failedOlderThanMs: z.number().optional(),
});

export type CleanupJobs = z.infer<typeof cleanupJobsSchema>;
