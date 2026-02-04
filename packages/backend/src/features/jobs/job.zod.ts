import { z } from "zod";
import { jobStatusValues } from "@blackwall/queue";

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

export const jobSchema = z.object({
    id: z.string(),
    type: z.string(),
    payload: z.any(),
    queue: z.string(),
    status: z.enum(jobStatusValues),
    priority: z.number(),
    attempts: z.number(),
    maxAttempts: z.number(),
    lastError: z.string().nullable().optional(),
    runAt: z.number(),
    lockedAt: z.number().nullable().optional(),
    lockedBy: z.string().nullable().optional(),
    createdAt: z.number(),
    updatedAt: z.number(),
    completedAt: z.number().nullable().optional(),
    failedAt: z.number().nullable().optional(),
});

export const jobStatsSchema = z.object({
    pending: z.number(),
    processing: z.number(),
    completed: z.number(),
    failed: z.number(),
});

export const jobListSchema = z.object({
    jobs: z.array(jobSchema),
});

export const jobResponseSchema = z.object({
    job: jobSchema,
});

export const jobStatsResponseSchema = z.object({
    stats: jobStatsSchema,
});

export const recoverStaleResponseSchema = z.object({
    recovered: z.number(),
});

