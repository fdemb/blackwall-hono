import { describe, it, expect, beforeEach, afterEach } from "bun:test";
import { jobService } from "./job.service";
import { createTestDb, cleanupTestDb, type TestDb } from "../../test/setup";

describe("Job Service - Job Execution", () => {
    let testDb: TestDb;

    beforeEach(async () => {
        testDb = await createTestDb();
        jobService.clearHandlers();
    });

    afterEach(() => {
        cleanupTestDb(testDb);
        jobService.clearHandlers();
    });

    describe("processJob", () => {
        it("should process a job successfully with registered handler", async () => {
            let handlerCalled = false;
            let receivedPayload: unknown = null;

            jobService.registerHandler("test-handler", async (payload) => {
                handlerCalled = true;
                receivedPayload = payload;
            });

            await jobService.addJob({
                type: "test-handler",
                payload: { message: "hello" },
                queue: "test-queue",
            });

            const result = await jobService.processJob("test-queue");

            expect(result).not.toBeNull();
            expect(result!.success).toBe(true);
            expect(handlerCalled).toBe(true);
            expect(receivedPayload).toEqual({ message: "hello" });

            const job = await jobService.getJobById(result!.job.id);
            expect(job?.status).toBe("completed");
        });

        it("should fail job when no handler is registered", async () => {
            await jobService.addJob({
                type: "unregistered-type",
                payload: {},
                queue: "test-queue",
                maxAttempts: 1,
            });

            const result = await jobService.processJob("test-queue");

            expect(result).not.toBeNull();
            expect(result!.success).toBe(false);
            expect(result!.error).toContain("No handler registered");

            const job = await jobService.getJobById(result!.job.id);
            expect(job?.status).toBe("failed");
            expect(job?.lastError).toContain("No handler registered");
        });

        it("should fail job when handler throws an error", async () => {
            jobService.registerHandler("failing-handler", async () => {
                throw new Error("Something went wrong");
            });

            await jobService.addJob({
                type: "failing-handler",
                payload: {},
                queue: "test-queue",
                maxAttempts: 1,
            });

            const result = await jobService.processJob("test-queue");

            expect(result).not.toBeNull();
            expect(result!.success).toBe(false);
            expect(result!.error).toBe("Something went wrong");

            const job = await jobService.getJobById(result!.job.id);
            expect(job?.status).toBe("failed");
            expect(job?.lastError).toBe("Something went wrong");
        });

        it("should return null when no jobs are available", async () => {
            const result = await jobService.processJob("empty-queue");
            expect(result).toBeNull();
        });

        it("should process jobs in order (FIFO)", async () => {
            const processedOrder: number[] = [];

            jobService.registerHandler<{ order: number }>("order-test", async (payload) => {
                processedOrder.push(payload.order);
            });

            await jobService.addJob({ type: "order-test", payload: { order: 1 }, queue: "order-queue" });
            await jobService.addJob({ type: "order-test", payload: { order: 2 }, queue: "order-queue" });
            await jobService.addJob({ type: "order-test", payload: { order: 3 }, queue: "order-queue" });

            await jobService.processJob("order-queue");
            await jobService.processJob("order-queue");
            await jobService.processJob("order-queue");

            expect(processedOrder).toEqual([1, 2, 3]);
        });

        it("should only process jobs from the specified queue", async () => {
            let handlerCalled = false;

            jobService.registerHandler("queue-test", async () => {
                handlerCalled = true;
            });

            await jobService.addJob({ type: "queue-test", payload: {}, queue: "queue-a" });

            const result = await jobService.processJob("queue-b");
            expect(result).toBeNull();
            expect(handlerCalled).toBe(false);

            const result2 = await jobService.processJob("queue-a");
            expect(result2).not.toBeNull();
            expect(handlerCalled).toBe(true);
        });

        it("should mark job as failed after exhausting maxAttempts", async () => {
            let attemptCount = 0;

            jobService.registerHandler("retry-test", async () => {
                attemptCount++;
                throw new Error("Fail on purpose");
            });

            await jobService.addJob({
                type: "retry-test",
                payload: {},
                queue: "retry-queue",
                maxAttempts: 1,
            });

            await jobService.processJob("retry-queue");
            expect(attemptCount).toBe(1);

            const jobs = await jobService.listJobs({ queue: "retry-queue", status: "failed" });
            expect(jobs.length).toBe(1);
            expect(jobs[0].lastError).toBe("Fail on purpose");
        });

        it("should set job to pending with backoff when retries remain", async () => {
            jobService.registerHandler("backoff-test", async () => {
                throw new Error("Temporary failure");
            });

            await jobService.addJob({
                type: "backoff-test",
                payload: {},
                queue: "backoff-queue",
                maxAttempts: 3,
            });

            await jobService.processJob("backoff-queue");

            const job = (await jobService.listJobs({ queue: "backoff-queue" }))[0];
            expect(job.status).toBe("pending");
            expect(job.attempts).toBe(1);
            expect(job.runAt).not.toBeNull();
            expect(job.runAt!.getTime()).toBeGreaterThan(Date.now());
        });
    });
});
