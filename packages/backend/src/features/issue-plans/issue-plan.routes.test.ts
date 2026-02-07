import { describe, it, expect } from "bun:test";
import { eq } from "drizzle-orm";
import { dbSchema } from "@blackwall/database";
import { useTestContext } from "../../test/context";
import { createIssue } from "../../test/fixtures";

describe("Issue Plan Routes", () => {
  const getCtx = useTestContext();

  const createPlan = async (overrides?: {
    name?: string;
    goal?: string | null;
    startDate?: Date;
    endDate?: Date;
    onUndoneIssues?: "moveToBacklog" | "moveToNewPlan";
  }) => {
    const { client, headers, team } = getCtx();
    const now = new Date();
    const nextWeek = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);

    const res = await client.api["issue-plans"].teams[":teamKey"].plans.$post(
      {
        param: { teamKey: team.key },
        json: {
          name: overrides?.name ?? "Sprint 1",
          goal: overrides?.goal ?? "Complete the milestone",
          startDate: (overrides?.startDate ?? now).toISOString().slice(0, 10),
          endDate: (overrides?.endDate ?? nextWeek).toISOString().slice(0, 10),
          onUndoneIssues: overrides?.onUndoneIssues ?? "moveToBacklog",
        },
      },
      { headers: headers() },
    );
    const json = (await res.json()) as {
      plan: { id: string; name: string; goal: string | null };
    };
    return { res, json };
  };

  describe("GET /issue-plans/teams/:teamKey/plans", () => {
    it("should return empty array when no plans exist", async () => {
      const { client, headers, team } = getCtx();
      const res = await client.api["issue-plans"].teams[":teamKey"].plans.$get(
        { param: { teamKey: team.key } },
        { headers: headers() },
      );

      expect(res.status).toBe(200);
      const json = (await res.json()) as { plans: unknown[] };
      expect(json.plans).toHaveLength(0);
    });

    it("should return list of plans for team", async () => {
      await createPlan({ name: "Sprint 1" });
      await createPlan({ name: "Sprint 2" });

      const { client, headers, team } = getCtx();
      const res = await client.api["issue-plans"].teams[":teamKey"].plans.$get(
        { param: { teamKey: team.key } },
        { headers: headers() },
      );

      expect(res.status).toBe(200);
      const json = (await res.json()) as { plans: unknown[] };
      expect(json.plans).toHaveLength(2);
    });

    it("should return 404 for non-existent team", async () => {
      const { client, headers } = getCtx();
      const res = await client.api["issue-plans"].teams[":teamKey"].plans.$get(
        { param: { teamKey: "nonexistent" } },
        { headers: headers() },
      );

      expect(res.status).toBe(404);
    });
  });

  describe("GET /issue-plans/teams/:teamKey/plans/active", () => {
    it("should return null when no active plan", async () => {
      const { client, headers, team } = getCtx();
      const res = await client.api["issue-plans"].teams[":teamKey"].plans.active.$get(
        { param: { teamKey: team.key } },
        { headers: headers() },
      );

      expect(res.status).toBe(200);
      const json = (await res.json()) as { plan: null };
      expect(json.plan).toBeNull();
    });

    it("should return active plan after creation", async () => {
      await createPlan({ name: "Sprint 1" });

      const { client, headers, team } = getCtx();
      const res = await client.api["issue-plans"].teams[":teamKey"].plans.active.$get(
        { param: { teamKey: team.key } },
        { headers: headers() },
      );

      expect(res.status).toBe(200);
      const json = (await res.json()) as { plan: { name: string } };
      expect(json.plan).not.toBeNull();
      expect(json.plan.name).toBe("Sprint 1");
    });
  });

  describe("GET /issue-plans/teams/:teamKey/plans/:planId", () => {
    it("should return plan with issues", async () => {
      const { json: createJson } = await createPlan({ name: "Sprint 1" });

      const { client, headers, team } = getCtx();
      const res = await client.api["issue-plans"].teams[":teamKey"].plans[":planId"].$get(
        { param: { teamKey: team.key, planId: createJson.plan.id } },
        { headers: headers() },
      );

      expect(res.status).toBe(200);
      const json = (await res.json()) as { plan: { name: string }; issues: unknown[] };
      expect(json.plan.name).toBe("Sprint 1");
      expect(json.issues).toBeDefined();
    });

    it("should return 404 for non-existent plan", async () => {
      const { client, headers, team } = getCtx();
      const res = await client.api["issue-plans"].teams[":teamKey"].plans[":planId"].$get(
        { param: { teamKey: team.key, planId: "00000000-0000-0000-0000-000000000000" } },
        { headers: headers() },
      );

      expect(res.status).toBe(404);
    });
  });

  describe("POST /issue-plans/teams/:teamKey/plans", () => {
    it("should create and activate a new plan", async () => {
      const { res, json } = await createPlan({ name: "Sprint 1", goal: "Ship it" });

      expect(res.status).toBe(201);
      expect(json.plan.name).toBe("Sprint 1");
      expect(json.plan.goal).toBe("Ship it");
    });

    it("should return 400 when name is empty", async () => {
      const { client, headers, team } = getCtx();
      const now = new Date();
      const nextWeek = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);

      const res = await client.api["issue-plans"].teams[":teamKey"].plans.$post(
        {
          param: { teamKey: team.key },
          json: {
            name: "",
            goal: null,
            startDate: now.toISOString().slice(0, 10),
            endDate: nextWeek.toISOString().slice(0, 10),
            onUndoneIssues: "moveToBacklog",
          },
        },
        { headers: headers() },
      );

      expect(res.status as number).toBe(400);
    });

    it("should return 400 when end date is before start date", async () => {
      const { client, headers, team } = getCtx();
      const now = new Date();
      const yesterday = new Date(now.getTime() - 24 * 60 * 60 * 1000);

      const res = await client.api["issue-plans"].teams[":teamKey"].plans.$post(
        {
          param: { teamKey: team.key },
          json: {
            name: "Invalid Sprint",
            goal: null,
            startDate: now.toISOString().slice(0, 10),
            endDate: yesterday.toISOString().slice(0, 10),
            onUndoneIssues: "moveToBacklog",
          },
        },
        { headers: headers() },
      );

      expect(res.status as number).toBe(400);
    });

    it("should return 404 for non-existent team", async () => {
      const { client, headers } = getCtx();
      const now = new Date();
      const nextWeek = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);

      const res = await client.api["issue-plans"].teams[":teamKey"].plans.$post(
        {
          param: { teamKey: "nonexistent" },
          json: {
            name: "Sprint 1",
            goal: null,
            startDate: now.toISOString().slice(0, 10),
            endDate: nextWeek.toISOString().slice(0, 10),
            onUndoneIssues: "moveToBacklog",
          },
        },
        { headers: headers() },
      );

      // @ts-expect-error test code
      expect(res.status).toBe(404);
    });
  });

  describe("PATCH /issue-plans/teams/:teamKey/plans/:planId", () => {
    it("should update a plan", async () => {
      const { json: createJson } = await createPlan({ name: "Sprint 1" });
      const now = new Date();
      const nextWeek = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);

      const { client, headers, team } = getCtx();
      const res = await client.api["issue-plans"].teams[":teamKey"].plans[":planId"].$patch(
        {
          param: { teamKey: team.key, planId: createJson.plan.id },
          json: {
            name: "Sprint 1 - Updated",
            goal: "New goal",
            startDate: now.toISOString().slice(0, 10),
            endDate: nextWeek.toISOString().slice(0, 10),
          },
        },
        { headers: headers() },
      );

      expect(res.status).toBe(200);
      const json = (await res.json()) as { plan: { name: string; goal: string } };
      expect(json.plan.name).toBe("Sprint 1 - Updated");
      expect(json.plan.goal).toBe("New goal");
    });

    it("should return 404 for non-existent plan", async () => {
      const { client, headers, team } = getCtx();
      const now = new Date();
      const nextWeek = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);

      const res = await client.api["issue-plans"].teams[":teamKey"].plans[":planId"].$patch(
        {
          param: { teamKey: team.key, planId: "00000000-0000-0000-0000-000000000000" },
          json: {
            name: "Updated",
            goal: null,
            startDate: now.toISOString().slice(0, 10),
            endDate: nextWeek.toISOString().slice(0, 10),
          },
        },
        { headers: headers() },
      );

      expect(res.status).toBe(404);
    });

    it("should return 400 when end date is before start date", async () => {
      const { json: createJson } = await createPlan({ name: "Sprint 1" });
      const { client, headers, team } = getCtx();
      const now = new Date();
      const yesterday = new Date(now.getTime() - 24 * 60 * 60 * 1000);

      const res = await client.api["issue-plans"].teams[":teamKey"].plans[":planId"].$patch(
        {
          param: { teamKey: team.key, planId: createJson.plan.id },
          json: {
            name: "Updated",
            goal: null,
            startDate: now.toISOString().slice(0, 10),
            endDate: yesterday.toISOString().slice(0, 10),
          },
        },
        { headers: headers() },
      );

      expect(res.status).toBe(400);
    });
  });

  describe("POST /issue-plans/teams/:teamKey/plans/:planId/complete", () => {
    it("should complete a plan", async () => {
      const now = new Date();
      const lastWeek = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
      const yesterday = new Date(now.getTime() - 24 * 60 * 60 * 1000);
      const { json: createJson } = await createPlan({
        name: "Sprint 1",
        startDate: lastWeek,
        endDate: yesterday,
      });

      const { client, headers, team } = getCtx();
      const res = await client.api["issue-plans"].teams[":teamKey"].plans[":planId"].complete.$post(
        {
          param: { teamKey: team.key, planId: createJson.plan.id },
          json: { onUndoneIssues: "moveToBacklog" },
        },
        { headers: headers() },
      );

      expect(res.status).toBe(200);

      const activeRes = await client.api["issue-plans"].teams[":teamKey"].plans.active.$get(
        { param: { teamKey: team.key } },
        { headers: headers() },
      );
      const activeJson = (await activeRes.json()) as { plan: null };
      expect(activeJson.plan).toBeNull();
    });

    it("should return 400 when completing already completed plan", async () => {
      const now = new Date();
      const lastWeek = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
      const yesterday = new Date(now.getTime() - 24 * 60 * 60 * 1000);
      const { json: createJson } = await createPlan({
        name: "Sprint 1",
        startDate: lastWeek,
        endDate: yesterday,
      });

      const { client, headers, team } = getCtx();
      await client.api["issue-plans"].teams[":teamKey"].plans[":planId"].complete.$post(
        {
          param: { teamKey: team.key, planId: createJson.plan.id },
          json: { onUndoneIssues: "moveToBacklog" },
        },
        { headers: headers() },
      );

      const res = await client.api["issue-plans"].teams[":teamKey"].plans[":planId"].complete.$post(
        {
          param: { teamKey: team.key, planId: createJson.plan.id },
          json: { onUndoneIssues: "moveToBacklog" },
        },
        { headers: headers() },
      );

      expect(res.status).toBe(400);
    });

    it("should return 400 when end date is in the future", async () => {
      const { json: createJson } = await createPlan({ name: "Sprint 1" });

      const { client, headers, team } = getCtx();
      const res = await client.api["issue-plans"].teams[":teamKey"].plans[":planId"].complete.$post(
        {
          param: { teamKey: team.key, planId: createJson.plan.id },
          json: { onUndoneIssues: "moveToBacklog" },
        },
        { headers: headers() },
      );

      expect(res.status).toBe(400);
    });

    it("should move undone issues to backlog when configured", async () => {
      const { testDb, team, user, workspace } = getCtx();
      const now = new Date();
      const lastWeek = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
      const yesterday = new Date(now.getTime() - 24 * 60 * 60 * 1000);
      const { json: createJson } = await createPlan({
        name: "Sprint 1",
        startDate: lastWeek,
        endDate: yesterday,
      });

      const activeIssue = await createIssue(testDb, {
        teamId: team.id,
        createdById: user.id,
        workspaceId: workspace.id,
        planId: createJson.plan.id,
        status: "to_do",
      });
      const inProgressIssue = await createIssue(testDb, {
        teamId: team.id,
        createdById: user.id,
        workspaceId: workspace.id,
        planId: createJson.plan.id,
        status: "in_progress",
      });
      const doneIssue = await createIssue(testDb, {
        teamId: team.id,
        createdById: user.id,
        workspaceId: workspace.id,
        planId: createJson.plan.id,
        status: "done",
      });

      const { client, headers } = getCtx();
      const res = await client.api["issue-plans"].teams[":teamKey"].plans[":planId"].complete.$post(
        {
          param: { teamKey: team.key, planId: createJson.plan.id },
          json: { onUndoneIssues: "moveToBacklog" },
        },
        { headers: headers() },
      );

      expect(res.status).toBe(200);

      const [activeUpdated] = await testDb.db
        .select()
        .from(dbSchema.issue)
        .where(eq(dbSchema.issue.id, activeIssue.id));
      const [inProgressUpdated] = await testDb.db
        .select()
        .from(dbSchema.issue)
        .where(eq(dbSchema.issue.id, inProgressIssue.id));
      const [doneUpdated] = await testDb.db
        .select()
        .from(dbSchema.issue)
        .where(eq(dbSchema.issue.id, doneIssue.id));

      expect(activeUpdated.planId).toBeNull();
      expect(activeUpdated.status).toBe("backlog");
      expect(inProgressUpdated.planId).toBeNull();
      expect(inProgressUpdated.status).toBe("backlog");
      expect(doneUpdated.planId).toBeNull();
      expect(doneUpdated.status).toBe("done");
    });

    it("should keep undone issues unplanned when configured", async () => {
      const { testDb, team, user, workspace } = getCtx();
      const now = new Date();
      const lastWeek = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
      const yesterday = new Date(now.getTime() - 24 * 60 * 60 * 1000);
      const { json: createJson } = await createPlan({
        name: "Sprint 1",
        startDate: lastWeek,
        endDate: yesterday,
      });

      const activeIssue = await createIssue(testDb, {
        teamId: team.id,
        createdById: user.id,
        workspaceId: workspace.id,
        planId: createJson.plan.id,
        status: "to_do",
      });

      const { client, headers } = getCtx();
      const res = await client.api["issue-plans"].teams[":teamKey"].plans[":planId"].complete.$post(
        {
          param: { teamKey: team.key, planId: createJson.plan.id },
          json: { onUndoneIssues: "moveToNewPlan" },
        },
        { headers: headers() },
      );

      expect(res.status).toBe(200);

      const [activeUpdated] = await testDb.db
        .select()
        .from(dbSchema.issue)
        .where(eq(dbSchema.issue.id, activeIssue.id));

      expect(activeUpdated.planId).toBeNull();
      expect(activeUpdated.status).toBe("to_do");
    });

    it("should return 404 for non-existent plan", async () => {
      const { client, headers, team } = getCtx();
      const res = await client.api["issue-plans"].teams[":teamKey"].plans[":planId"].complete.$post(
        {
          param: { teamKey: team.key, planId: "00000000-0000-0000-0000-000000000000" },
          json: { onUndoneIssues: "moveToBacklog" },
        },
        { headers: headers() },
      );

      expect(res.status).toBe(404);
    });
  });

  describe("DELETE /issue-plans/teams/:teamKey/plans/:planId", () => {
    it("should delete a non-active plan", async () => {
      const { json: createJson } = await createPlan({ name: "Sprint 1" });
      await createPlan({ name: "Sprint 2" });

      const { client, headers, team } = getCtx();
      const res = await client.api["issue-plans"].teams[":teamKey"].plans[":planId"].$delete(
        { param: { teamKey: team.key, planId: createJson.plan.id } },
        { headers: headers() },
      );

      expect(res.status).toBe(200);
    });

    it("should return 400 when deleting the active plan", async () => {
      const { json: createJson } = await createPlan({ name: "Sprint 1" });
      const { client, headers, team } = getCtx();
      const res = await client.api["issue-plans"].teams[":teamKey"].plans[":planId"].$delete(
        { param: { teamKey: team.key, planId: createJson.plan.id } },
        { headers: headers() },
      );

      expect(res.status).toBe(400);
    });
  });
});
