import type { JobStatus } from "../../db/schema/job.schema";
import { jobData } from "./job.data";

type JobHandler<T = unknown> = (payload: T) => Promise<void>;

const handlers = new Map<string, JobHandler>();

/**
 * Register a handler for a specific job type.
 * @param type job type identifier
 * @param handler async function to process the job payload
 */
function registerHandler<T>(type: string, handler: JobHandler<T>) {
    handlers.set(type, handler as JobHandler);
}

/**
 * Get the registered handler for a job type.
 * @param type job type identifier
 * @returns handler function or undefined
 */
function getHandler(type: string): JobHandler | undefined {
    return handlers.get(type);
}

/**
 * Add a new job to the queue.
 * @param input job type, payload, and optional queue/delay/maxAttempts
 * @returns created job
 */
async function addJob<T>(input: {
    type: string;
    payload: T;
    queue?: string;
    delay?: number;
    maxAttempts?: number;
}) {
    return jobData.addJob(input);
}

/**
 * Claim the next available job from a queue for processing.
 * @param queue queue name
 * @param lockDurationMs duration to lock the job (default 30s)
 * @returns claimed job or null
 */
async function claimJob(queue: string, lockDurationMs = 30_000) {
    return jobData.claimJob(queue, lockDurationMs);
}

/**
 * Mark a job as successfully completed.
 * @param id job id
 */
async function completeJob(id: string) {
    return jobData.completeJob(id);
}

/**
 * Mark a job as failed with an error message.
 * @param id job id
 * @param error error message
 */
async function failJob(id: string, error: string) {
    return jobData.failJob(id, error);
}

/**
 * Recover jobs that were locked but never completed (stale).
 * @returns number of recovered jobs
 */
async function recoverStaleJobs() {
    return jobData.recoverStaleJobs();
}

/**
 * Clean up old completed and failed jobs.
 * @param opts optional age thresholds for cleanup
 */
async function cleanupJobs(opts?: { completedOlderThanMs?: number; failedOlderThanMs?: number }) {
    return jobData.cleanupJobs(opts);
}

/**
 * Get statistics about jobs in a queue.
 * @param queue optional queue name filter
 * @returns job statistics
 */
async function getJobStats(queue?: string) {
    return jobData.getJobStats(queue);
}

/**
 * List jobs with optional filters.
 * @param input optional queue, status, and limit filters
 * @returns list of jobs
 */
async function listJobs(input: { queue?: string; status?: JobStatus; limit?: number }) {
    return jobData.listJobs(input);
}

/**
 * Get a job by its id.
 * @param id job id
 * @returns job data or null
 */
async function getJobById(id: string) {
    return jobData.getJobById(id);
}

/**
 * Claim and process a job from a queue using its registered handler.
 * @param queue queue name
 * @param lockDurationMs duration to lock the job (default 30s)
 * @returns processing result with job and success status, or null if no job
 */
async function processJob(queue: string, lockDurationMs = 30_000) {
    const job = await claimJob(queue, lockDurationMs);
    if (!job) return null;

    const handler = getHandler(job.type);
    if (!handler) {
        await failJob(job.id, `No handler registered for job type: ${job.type}`);
        return { job, success: false, error: `No handler registered for job type: ${job.type}` };
    }

    try {
        const payload = JSON.parse(job.payload);
        await handler(payload);
        await completeJob(job.id);
        return { job, success: true };
    } catch (err) {
        const errorMessage = err instanceof Error ? err.message : String(err);
        await failJob(job.id, errorMessage);
        return { job, success: false, error: errorMessage };
    }
}

/**
 * Clear all registered job handlers. Useful for testing.
 */
function clearHandlers() {
    handlers.clear();
}

export const jobService = {
    registerHandler,
    getHandler,
    addJob,
    claimJob,
    completeJob,
    failJob,
    recoverStaleJobs,
    cleanupJobs,
    getJobStats,
    listJobs,
    getJobById,
    processJob,
    clearHandlers,
};

export type { JobHandler };
