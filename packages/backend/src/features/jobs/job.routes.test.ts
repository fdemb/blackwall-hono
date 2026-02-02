import { describe, it, expect } from "bun:test";
import { useTestContext } from "../../test/context";

describe("Job Routes", () => {
    const getCtx = useTestContext();

    describe("GET /jobs/stats", () => {
        it("should return empty stats when no jobs exist", async () => {
            const { client, headersWithoutWorkspace } = getCtx();
            const res = await client.jobs.stats.$get(
                { query: {} },
                { headers: headersWithoutWorkspace() },
            );

            expect(res.status).toBe(200);
            const json = await res.json();
            expect(json.stats).toBeInstanceOf(Object);
        });

        it("should filter stats by queue", async () => {
            const { client, headersWithoutWorkspace } = getCtx();
            const res = await client.jobs.stats.$get(
                { query: { queue: "email" } },
                { headers: headersWithoutWorkspace() },
            );

            expect(res.status).toBe(200);
            const json = await res.json();
            expect(json.stats).toBeInstanceOf(Object);
        });
    });

    describe("POST /jobs", () => {
        it("should create a new job", async () => {
            const { client, headersWithoutWorkspace } = getCtx();
            const res = await client.jobs.$post(
                {
                    json: {
                        type: "test-job",
                        payload: { foo: "bar" },
                    },
                },
                { headers: headersWithoutWorkspace() },
            );

            expect(res.status).toBe(201);
            const json = await res.json();
            expect(json.job).toHaveProperty("id");
            expect(json.job.type).toBe("test-job");
            expect(json.job.status).toBe("pending");
        });

        it("should create a job with custom queue", async () => {
            const { client, headersWithoutWorkspace } = getCtx();
            const res = await client.jobs.$post(
                {
                    json: {
                        type: "email-job",
                        payload: { to: "test@example.com" },
                        queue: "email",
                    },
                },
                { headers: headersWithoutWorkspace() },
            );

            expect(res.status).toBe(201);
            const json = await res.json();
            expect(json.job.queue).toBe("email");
        });

        it("should create a job with delay", async () => {
            const { client, headersWithoutWorkspace } = getCtx();
            const res = await client.jobs.$post(
                {
                    json: {
                        type: "delayed-job",
                        payload: {},
                        delay: 60000,
                    },
                },
                { headers: headersWithoutWorkspace() },
            );

            expect(res.status).toBe(201);
            const json = await res.json();
            expect(json.job.runAt).not.toBeNull();
        });
    });

    describe("GET /jobs", () => {
        it("should list jobs", async () => {
            const { client, headersWithoutWorkspace } = getCtx();

            await client.jobs.$post(
                {
                    json: {
                        type: "list-test-job",
                        payload: {},
                    },
                },
                { headers: headersWithoutWorkspace() },
            );

            const res = await client.jobs.$get({ query: {} }, { headers: headersWithoutWorkspace() });

            expect(res.status).toBe(200);
            const json = await res.json();
            expect(json.jobs).toBeInstanceOf(Array);
            expect(json.jobs.length).toBeGreaterThanOrEqual(1);
        });

        it("should filter jobs by status", async () => {
            const { client, headersWithoutWorkspace } = getCtx();

            await client.jobs.$post(
                {
                    json: {
                        type: "filter-test-job",
                        payload: {},
                    },
                },
                { headers: headersWithoutWorkspace() },
            );

            const res = await client.jobs.$get(
                { query: { status: "pending" } },
                { headers: headersWithoutWorkspace() },
            );

            expect(res.status).toBe(200);
            const json = await res.json();
            expect(json.jobs.every((j: { status: string }) => j.status === "pending")).toBe(true);
        });
    });

    describe("GET /jobs/:id", () => {
        it("should return a specific job", async () => {
            const { client, headersWithoutWorkspace } = getCtx();

            const createRes = await client.jobs.$post(
                {
                    json: {
                        type: "get-test-job",
                        payload: { data: "test" },
                    },
                },
                { headers: headersWithoutWorkspace() },
            );
            const { job: createdJob } = await createRes.json();

            const res = await client.jobs[":id"].$get(
                { param: { id: createdJob.id } },
                { headers: headersWithoutWorkspace() },
            );

            expect(res.status).toBe(200);
            const json = (await res.json()) as { job: { id: string; type: string } };
            expect(json.job.id).toBe(createdJob.id);
            expect(json.job.type).toBe("get-test-job");
        });

        it("should return 404 for non-existent job", async () => {
            const { client, headersWithoutWorkspace } = getCtx();

            const res = await client.jobs[":id"].$get(
                { param: { id: "non-existent-id" } },
                { headers: headersWithoutWorkspace() },
            );

            expect(res.status).toBe(404);
        });
    });

    describe("POST /jobs/recover-stale", () => {
        it("should recover stale jobs", async () => {
            const { client, headersWithoutWorkspace } = getCtx();
            const res = await client.jobs["recover-stale"].$post(
                {},
                { headers: headersWithoutWorkspace() },
            );

            expect(res.status).toBe(200);
            const json = await res.json();
            expect(typeof json.recovered).toBe("number");
        });
    });

    describe("POST /jobs/cleanup", () => {
        it("should cleanup old jobs", async () => {
            const { client, headersWithoutWorkspace } = getCtx();
            const res = await client.jobs.cleanup.$post({ json: {} }, { headers: headersWithoutWorkspace() });

            expect(res.status).toBe(200);
            const json = await res.json();
            expect(json.success).toBe(true);
        });

        it("should accept custom cleanup options", async () => {
            const { client, headersWithoutWorkspace } = getCtx();
            const res = await client.jobs.cleanup.$post(
                {
                    json: {
                        completedOlderThanMs: 86400000,
                        failedOlderThanMs: 604800000,
                    },
                },
                { headers: headersWithoutWorkspace() },
            );

            expect(res.status).toBe(200);
            const json = await res.json();
            expect(json.success).toBe(true);
        });
    });
});
