import { describe, it, expect } from "bun:test";
import { eq } from "drizzle-orm";
import { dbSchema } from "@blackwall/database";
import { useTestContext } from "../../test/context";
import { createIssue } from "../../test/fixtures";

describe("Issue Sprint Routes", () => {
  const getCtx = useTestContext();

  const createSprint = async (overrides?: {
    name?: string;
    goal?: string | null;
    startDate?: Date;
    endDate?: Date;
    onUndoneIssues?: "moveToBacklog" | "moveToNewSprint";
  }) => {
    const { client, headers, team } = getCtx();
    const now = new Date();
    const nextWeek = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);

    const res = await client.api["issue-sprints"].teams[":teamKey"].sprints.$post(
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
      sprint: { id: string; name: string; goal: string | null };
    };
    return { res, json };
  };

  describe("GET /issue-sprints/teams/:teamKey/sprints", () => {
    it("should return empty array when no sprints exist", async () => {
      const { client, headers, team } = getCtx();
      const res = await client.api["issue-sprints"].teams[":teamKey"].sprints.$get(
        { param: { teamKey: team.key } },
        { headers: headers() },
      );

      expect(res.status).toBe(200);
      const json = (await res.json()) as { sprints: unknown[] };
      expect(json.sprints).toHaveLength(0);
    });

    it("should return list of sprints for team", async () => {
      await createSprint({ name: "Sprint 1" });
      await createSprint({ name: "Sprint 2" });

      const { client, headers, team } = getCtx();
      const res = await client.api["issue-sprints"].teams[":teamKey"].sprints.$get(
        { param: { teamKey: team.key } },
        { headers: headers() },
      );

      expect(res.status).toBe(200);
      const json = (await res.json()) as { sprints: unknown[] };
      expect(json.sprints).toHaveLength(2);
    });

    it("should return 404 for non-existent team", async () => {
      const { client, headers } = getCtx();
      const res = await client.api["issue-sprints"].teams[":teamKey"].sprints.$get(
        { param: { teamKey: "nonexistent" } },
        { headers: headers() },
      );

      expect(res.status).toBe(404);
    });
  });

  describe("GET /issue-sprints/teams/:teamKey/sprints/active", () => {
    it("should return null when no active sprint", async () => {
      const { client, headers, team } = getCtx();
      const res = await client.api["issue-sprints"].teams[":teamKey"].sprints.active.$get(
        { param: { teamKey: team.key } },
        { headers: headers() },
      );

      expect(res.status).toBe(200);
      const json = (await res.json()) as { sprint: null };
      expect(json.sprint).toBeNull();
    });

    it("should return active sprint after creation", async () => {
      await createSprint({ name: "Sprint 1" });

      const { client, headers, team } = getCtx();
      const res = await client.api["issue-sprints"].teams[":teamKey"].sprints.active.$get(
        { param: { teamKey: team.key } },
        { headers: headers() },
      );

      expect(res.status).toBe(200);
      const json = (await res.json()) as { sprint: { name: string } };
      expect(json.sprint).not.toBeNull();
      expect(json.sprint.name).toBe("Sprint 1");
    });
  });

  describe("GET /issue-sprints/teams/:teamKey/sprints/:sprintId", () => {
    it("should return sprint with issues", async () => {
      const { json: createJson } = await createSprint({ name: "Sprint 1" });

      const { client, headers, team } = getCtx();
      const res = await client.api["issue-sprints"].teams[":teamKey"].sprints[":sprintId"].$get(
        { param: { teamKey: team.key, sprintId: createJson.sprint.id } },
        { headers: headers() },
      );

      expect(res.status).toBe(200);
      const json = (await res.json()) as { sprint: { name: string }; issues: unknown[] };
      expect(json.sprint.name).toBe("Sprint 1");
      expect(json.issues).toBeDefined();
    });

    it("should return 404 for non-existent sprint", async () => {
      const { client, headers, team } = getCtx();
      const res = await client.api["issue-sprints"].teams[":teamKey"].sprints[":sprintId"].$get(
        { param: { teamKey: team.key, sprintId: "00000000-0000-0000-0000-000000000000" } },
        { headers: headers() },
      );

      expect(res.status).toBe(404);
    });
  });

  describe("POST /issue-sprints/teams/:teamKey/sprints", () => {
    it("should create and activate a new sprint", async () => {
      const { res, json } = await createSprint({ name: "Sprint 1", goal: "Ship it" });

      expect(res.status).toBe(201);
      expect(json.sprint.name).toBe("Sprint 1");
      expect(json.sprint.goal).toBe("Ship it");
    });

    it("should return 400 when name is empty", async () => {
      const { client, headers, team } = getCtx();
      const now = new Date();
      const nextWeek = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);

      const res = await client.api["issue-sprints"].teams[":teamKey"].sprints.$post(
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

      const res = await client.api["issue-sprints"].teams[":teamKey"].sprints.$post(
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

      const res = await client.api["issue-sprints"].teams[":teamKey"].sprints.$post(
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

  describe("PATCH /issue-sprints/teams/:teamKey/sprints/:sprintId", () => {
    it("should update a sprint", async () => {
      const { json: createJson } = await createSprint({ name: "Sprint 1" });
      const now = new Date();
      const nextWeek = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);

      const { client, headers, team } = getCtx();
      const res = await client.api["issue-sprints"].teams[":teamKey"].sprints[":sprintId"].$patch(
        {
          param: { teamKey: team.key, sprintId: createJson.sprint.id },
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
      const json = (await res.json()) as { sprint: { name: string; goal: string } };
      expect(json.sprint.name).toBe("Sprint 1 - Updated");
      expect(json.sprint.goal).toBe("New goal");
    });

    it("should return 404 for non-existent sprint", async () => {
      const { client, headers, team } = getCtx();
      const now = new Date();
      const nextWeek = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);

      const res = await client.api["issue-sprints"].teams[":teamKey"].sprints[":sprintId"].$patch(
        {
          param: { teamKey: team.key, sprintId: "00000000-0000-0000-0000-000000000000" },
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
      const { json: createJson } = await createSprint({ name: "Sprint 1" });
      const { client, headers, team } = getCtx();
      const now = new Date();
      const yesterday = new Date(now.getTime() - 24 * 60 * 60 * 1000);

      const res = await client.api["issue-sprints"].teams[":teamKey"].sprints[":sprintId"].$patch(
        {
          param: { teamKey: team.key, sprintId: createJson.sprint.id },
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

  describe("POST /issue-sprints/teams/:teamKey/sprints/:sprintId/complete", () => {
    it("should complete a sprint", async () => {
      const now = new Date();
      const lastWeek = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
      const yesterday = new Date(now.getTime() - 24 * 60 * 60 * 1000);
      const { json: createJson } = await createSprint({
        name: "Sprint 1",
        startDate: lastWeek,
        endDate: yesterday,
      });

      const { client, headers, team } = getCtx();
      const res = await client.api["issue-sprints"].teams[":teamKey"].sprints[":sprintId"].complete.$post(
        {
          param: { teamKey: team.key, sprintId: createJson.sprint.id },
          json: { onUndoneIssues: "moveToBacklog" },
        },
        { headers: headers() },
      );

      expect(res.status).toBe(200);

      const activeRes = await client.api["issue-sprints"].teams[":teamKey"].sprints.active.$get(
        { param: { teamKey: team.key } },
        { headers: headers() },
      );
      const activeJson = (await activeRes.json()) as { sprint: null };
      expect(activeJson.sprint).toBeNull();
    });

    it("should return 400 when completing already completed sprint", async () => {
      const now = new Date();
      const lastWeek = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
      const yesterday = new Date(now.getTime() - 24 * 60 * 60 * 1000);
      const { json: createJson } = await createSprint({
        name: "Sprint 1",
        startDate: lastWeek,
        endDate: yesterday,
      });

      const { client, headers, team } = getCtx();
      await client.api["issue-sprints"].teams[":teamKey"].sprints[":sprintId"].complete.$post(
        {
          param: { teamKey: team.key, sprintId: createJson.sprint.id },
          json: { onUndoneIssues: "moveToBacklog" },
        },
        { headers: headers() },
      );

      const res = await client.api["issue-sprints"].teams[":teamKey"].sprints[":sprintId"].complete.$post(
        {
          param: { teamKey: team.key, sprintId: createJson.sprint.id },
          json: { onUndoneIssues: "moveToBacklog" },
        },
        { headers: headers() },
      );

      expect(res.status).toBe(400);
    });

    it("should return 400 when end date is in the future", async () => {
      const { json: createJson } = await createSprint({ name: "Sprint 1" });

      const { client, headers, team } = getCtx();
      const res = await client.api["issue-sprints"].teams[":teamKey"].sprints[":sprintId"].complete.$post(
        {
          param: { teamKey: team.key, sprintId: createJson.sprint.id },
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
      const { json: createJson } = await createSprint({
        name: "Sprint 1",
        startDate: lastWeek,
        endDate: yesterday,
      });

      const activeIssue = await createIssue(testDb, {
        teamId: team.id,
        createdById: user.id,
        workspaceId: workspace.id,
        sprintId: createJson.sprint.id,
        status: "to_do",
      });
      const inProgressIssue = await createIssue(testDb, {
        teamId: team.id,
        createdById: user.id,
        workspaceId: workspace.id,
        sprintId: createJson.sprint.id,
        status: "in_progress",
      });
      const doneIssue = await createIssue(testDb, {
        teamId: team.id,
        createdById: user.id,
        workspaceId: workspace.id,
        sprintId: createJson.sprint.id,
        status: "done",
      });

      const { client, headers } = getCtx();
      const res = await client.api["issue-sprints"].teams[":teamKey"].sprints[":sprintId"].complete.$post(
        {
          param: { teamKey: team.key, sprintId: createJson.sprint.id },
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

      expect(activeUpdated.sprintId).toBeNull();
      expect(activeUpdated.status).toBe("to_do");
      expect(inProgressUpdated.sprintId).toBeNull();
      expect(inProgressUpdated.status).toBe("in_progress");
      expect(doneUpdated.sprintId).toBeNull();
      expect(doneUpdated.status).toBe("done");
    });

    it("should keep undone issues unsprinted when configured", async () => {
      const { testDb, team, user, workspace } = getCtx();
      const now = new Date();
      const lastWeek = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
      const yesterday = new Date(now.getTime() - 24 * 60 * 60 * 1000);
      const { json: createJson } = await createSprint({
        name: "Sprint 1",
        startDate: lastWeek,
        endDate: yesterday,
      });

      const activeIssue = await createIssue(testDb, {
        teamId: team.id,
        createdById: user.id,
        workspaceId: workspace.id,
        sprintId: createJson.sprint.id,
        status: "to_do",
      });

      const { client, headers } = getCtx();
      const res = await client.api["issue-sprints"].teams[":teamKey"].sprints[":sprintId"].complete.$post(
        {
          param: { teamKey: team.key, sprintId: createJson.sprint.id },
          json: { onUndoneIssues: "moveToNewSprint" },
        },
        { headers: headers() },
      );

      expect(res.status).toBe(200);

      const [activeUpdated] = await testDb.db
        .select()
        .from(dbSchema.issue)
        .where(eq(dbSchema.issue.id, activeIssue.id));

      expect(activeUpdated.sprintId).toBeNull();
      expect(activeUpdated.status).toBe("to_do");
    });

    it("should return 404 for non-existent sprint", async () => {
      const { client, headers, team } = getCtx();
      const res = await client.api["issue-sprints"].teams[":teamKey"].sprints[":sprintId"].complete.$post(
        {
          param: { teamKey: team.key, sprintId: "00000000-0000-0000-0000-000000000000" },
          json: { onUndoneIssues: "moveToBacklog" },
        },
        { headers: headers() },
      );

      expect(res.status).toBe(404);
    });
  });

  describe("DELETE /issue-sprints/teams/:teamKey/sprints/:sprintId", () => {
    it("should delete a non-active sprint", async () => {
      const { json: createJson } = await createSprint({ name: "Sprint 1" });
      await createSprint({ name: "Sprint 2" });

      const { client, headers, team } = getCtx();
      const res = await client.api["issue-sprints"].teams[":teamKey"].sprints[":sprintId"].$delete(
        { param: { teamKey: team.key, sprintId: createJson.sprint.id } },
        { headers: headers() },
      );

      expect(res.status).toBe(200);
    });

    it("should return 400 when deleting the active sprint", async () => {
      const { json: createJson } = await createSprint({ name: "Sprint 1" });
      const { client, headers, team } = getCtx();
      const res = await client.api["issue-sprints"].teams[":teamKey"].sprints[":sprintId"].$delete(
        { param: { teamKey: team.key, sprintId: createJson.sprint.id } },
        { headers: headers() },
      );

      expect(res.status).toBe(400);
    });
  });
});
