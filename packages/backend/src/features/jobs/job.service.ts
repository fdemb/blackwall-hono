import type { JobStatus } from "../../db/schema/job.schema";
import { jobData } from "./job.data";

type JobHandler<T = unknown> = (payload: T) => Promise<void>;

const handlers = new Map<string, JobHandler>();

function registerHandler<T>(type: string, handler: JobHandler<T>) {
    handlers.set(type, handler as JobHandler);
}

function getHandler(type: string): JobHandler | undefined {
    return handlers.get(type);
}

async function addJob<T>(input: {
    type: string;
    payload: T;
    queue?: string;
    delay?: number;
    maxAttempts?: number;
}) {
    return jobData.addJob(input);
}

async function claimJob(queue: string, lockDurationMs = 30_000) {
    return jobData.claimJob(queue, lockDurationMs);
}

async function completeJob(id: string) {
    return jobData.completeJob(id);
}

async function failJob(id: string, error: string) {
    return jobData.failJob(id, error);
}

async function recoverStaleJobs() {
    return jobData.recoverStaleJobs();
}

async function cleanupJobs(opts?: { completedOlderThanMs?: number; failedOlderThanMs?: number }) {
    return jobData.cleanupJobs(opts);
}

async function getJobStats(queue?: string) {
    return jobData.getJobStats(queue);
}

async function listJobs(input: { queue?: string; status?: JobStatus; limit?: number }) {
    return jobData.listJobs(input);
}

async function getJobById(id: string) {
    return jobData.getJobById(id);
}

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
