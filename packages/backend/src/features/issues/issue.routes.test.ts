import { describe, it, expect } from "bun:test";
import { useTestContext } from "../../test/context";
import { createIssuePlan } from "../../test/fixtures";

describe("Issue Routes", () => {
  const getCtx = useTestContext();

  const createIssue = (issue: {
    summary: string;
    description?: object;
    status: "backlog" | "to_do" | "in_progress" | "done";
    assignedToId: string | null;
    planId: string | null;
  }) => {
    const { client, headers, team } = getCtx();
    return client.issues.$post(
      {
        json: {
          teamKey: team.key,
          issue: {
            description: {},
            ...issue,
          },
        },
      },
      {
        headers: headers(),
      },
    );
  };

  describe("GET /issues", () => {
    it("should return empty array when no issues exist", async () => {
      const { client, headers, team } = getCtx();
      const res = await client.issues.$get(
        {
          query: { teamKey: team.key },
        },
        {
          headers: headers(),
        },
      );

      expect(res.status).toBe(200);
      const json = await res.json();
      expect(json).toEqual({ issues: [] });
    });

    it("should return list of issues for a team", async () => {
      await createIssue({
        summary: "Test Issue 1",
        status: "to_do",
        assignedToId: null,
        planId: null,
      });
      await createIssue({
        summary: "Test Issue 2",
        status: "in_progress",
        assignedToId: null,
        planId: null,
      });
      await createIssue({
        summary: "Test Issue 3",
        status: "done",
        assignedToId: null,
        planId: null,
      });

      const { client, headers, team } = getCtx();
      const res = await client.issues.$get(
        {
          query: { teamKey: team.key },
        },
        {
          headers: headers(),
        },
      );

      expect(res.status).toBe(200);
      const json = await res.json();
      expect(json.issues).toHaveLength(3);
      expect(json.issues[0].key).toBe("TES-1");
      expect(json.issues[1].key).toBe("TES-2");
      expect(json.issues[2].key).toBe("TES-3");
    });

    it("should filter issues by status", async () => {
      await createIssue({
        summary: "Test Issue 1",
        status: "to_do",
        assignedToId: null,
        planId: null,
      });
      await createIssue({
        summary: "Test Issue 2",
        status: "in_progress",
        assignedToId: null,
        planId: null,
      });
      await createIssue({
        summary: "Test Issue 3",
        status: "done",
        assignedToId: null,
        planId: null,
      });

      const { client, headers, team } = getCtx();
      const res = await client.issues.$get(
        {
          query: { teamKey: team.key, statusFilters: ["to_do", "done"] },
        },
        {
          headers: headers(),
        },
      );

      expect(res.status).toBe(200);
      const json = await res.json();
      expect(json.issues).toHaveLength(2);
      expect(json.issues.map((i: any) => i.status)).toEqual(["to_do", "done"]);
    });

    it("should include assignedTo, labels, and issuePlan relations", async () => {
      await createIssue({
        summary: "Test Issue 1",
        status: "to_do",
        assignedToId: null,
        planId: null,
      });

      const { client, headers, team } = getCtx();
      const res = await client.issues.$get(
        {
          query: { teamKey: team.key },
        },
        {
          headers: headers(),
        },
      );

      expect(res.status).toBe(200);
      const json = await res.json();
      expect(json.issues[0]).toHaveProperty("assignedTo");
      expect(json.issues[0]).toHaveProperty("labels");
      expect(json.issues[0]).toHaveProperty("issuePlan");
    });

    it("should return 400 when teamKey is missing", async () => {
      const { client, headers } = getCtx();
      const res = await client.issues.$get(
        // @ts-expect-error - intentionally missing query.teamKey for validation test
        {},
        {
          headers: headers(),
        },
      );

      expect(res.status).toBe(400);
    });
  });

  describe("POST /issues", () => {
    it("should create a new issue", async () => {
      const res = await createIssue({
        summary: "New Test Issue",
        status: "backlog",
        assignedToId: null,
        planId: null,
      });

      expect(res.status).toBe(200);
      const json = await res.json();
      expect(json.issue).toHaveProperty("id");
      expect(json.issue.summary).toBe("New Test Issue");
      expect(json.issue.key).toMatch(/^TES-\d+$/);
    });

    it("should create issue with assignee", async () => {
      const { user } = getCtx();
      const res = await createIssue({
        summary: "Assigned Issue",
        status: "to_do",
        assignedToId: user.id,
        planId: null,
      });

      expect(res.status).toBe(200);
      const json = await res.json();
      expect(json.issue.assignedToId).toBe(user.id);
    });

    it("should create issue with plan", async () => {
      const { testDb, team, user } = getCtx();
      const plan = await createIssuePlan(testDb, { teamId: team.id, createdById: user.id });
      const res = await createIssue({
        summary: "Planned Issue",
        status: "to_do",
        assignedToId: null,
        planId: plan.id,
      });

      expect(res.status).toBe(200);
      const json = await res.json();
      expect(json.issue.planId).toBe(plan.id);
    });

    it("should return 400 when summary is missing", async () => {
      const { client, headers, team } = getCtx();
      const res = await client.issues.$post(
        {
          json: {
            teamKey: team.key,
            // @ts-expect-error - intentionally missing summary for validation test
            issue: {
              description: {},
              status: "backlog",
            },
          },
        },
        {
          headers: headers(),
        },
      );

      expect(res.status).toBe(400);
    });

    it("should return 400 when teamKey is missing", async () => {
      const { client, headers } = getCtx();
      const res = await client.issues.$post(
        {
          // @ts-expect-error - intentionally missing teamKey for validation test
          json: {
            issue: {
              summary: "Test Issue",
              description: {},
              status: "backlog",
            },
          },
        },
        {
          headers: headers(),
        },
      );

      expect(res.status).toBe(400);
    });

    it("should return 400 when status is invalid", async () => {
      const { client, headers, team } = getCtx();
      const res = await client.issues.$post(
        {
          json: {
            teamKey: team.key,
            issue: {
              summary: "Test Issue",
              description: {},
              // @ts-expect-error - intentionally invalid status for validation test
              status: "invalid_status",
            },
          },
        },
        {
          headers: headers(),
        },
      );

      expect(res.status).toBe(400);
    });
  });

  describe("GET /issues/:issueKey", () => {
    it("should return an issue by key", async () => {
      const createRes = await createIssue({
        summary: "Test Issue",
        status: "to_do",
        assignedToId: null,
        planId: null,
      });
      const created = await createRes.json();

      const { client, headers } = getCtx();
      const res = await client.issues[":issueKey"].$get(
        {
          param: { issueKey: created.issue.key },
        },
        {
          headers: headers(),
        },
      );

      expect(res.status).toBe(200);
      const json = await res.json();
      expect(json.issue.key).toBe(created.issue.key);
      expect(json.issue.summary).toBe("Test Issue");
    });

    it("should include relations", async () => {
      const createRes = await createIssue({
        summary: "Test Issue",
        status: "to_do",
        assignedToId: null,
        planId: null,
      });
      const created = await createRes.json();

      const { client, headers } = getCtx();
      const res = await client.issues[":issueKey"].$get(
        {
          param: { issueKey: created.issue.key },
        },
        {
          headers: headers(),
        },
      );

      expect(res.status).toBe(200);
      const json = await res.json();
      expect(json.issue).toHaveProperty("team");
      expect(json.issue).toHaveProperty("comments");
      expect(json.issue).toHaveProperty("changeEvents");
    });
  });

  describe("PATCH /issues/:issueKey", () => {
    it("should update issue status", async () => {
      const createRes = await createIssue({
        summary: "Test Issue",
        status: "to_do",
        assignedToId: null,
        planId: null,
      });
      const created = await createRes.json();

      const { client, headers } = getCtx();
      const res = await client.issues[":issueKey"].$patch(
        {
          param: { issueKey: created.issue.key },
          json: { status: "in_progress" },
        },
        {
          headers: headers(),
        },
      );

      expect(res.status).toBe(200);
      const json = await res.json();
      expect(json.issue.status).toBe("in_progress");
    });

    it("should update issue summary", async () => {
      const createRes = await createIssue({
        summary: "Original Summary",
        status: "to_do",
        assignedToId: null,
        planId: null,
      });
      const created = await createRes.json();

      const { client, headers } = getCtx();
      const res = await client.issues[":issueKey"].$patch(
        {
          param: { issueKey: created.issue.key },
          json: { summary: "Updated Summary" },
        },
        {
          headers: headers(),
        },
      );

      expect(res.status).toBe(200);
      const json = await res.json();
      expect(json.issue.summary).toBe("Updated Summary");
    });

    it("should update issue priority", async () => {
      const createRes = await createIssue({
        summary: "Test Issue",
        status: "to_do",
        assignedToId: null,
        planId: null,
      });
      const created = await createRes.json();

      const { client, headers } = getCtx();
      const res = await client.issues[":issueKey"].$patch(
        {
          param: { issueKey: created.issue.key },
          json: { priority: "high" },
        },
        {
          headers: headers(),
        },
      );

      expect(res.status).toBe(200);
      const json = await res.json();
      expect(json.issue.priority).toBe("high");
    });

    it("should update issue assignee", async () => {
      const createRes = await createIssue({
        summary: "Test Issue",
        status: "to_do",
        assignedToId: null,
        planId: null,
      });
      const created = await createRes.json();

      const { client, headers, user } = getCtx();
      const res = await client.issues[":issueKey"].$patch(
        {
          param: { issueKey: created.issue.key },
          json: { assignedToId: user.id },
        },
        {
          headers: headers(),
        },
      );

      expect(res.status).toBe(200);
      const json = await res.json();
      expect(json.issue.assignedToId).toBe(user.id);
    });
  });

  describe("DELETE /issues/:issueKey", () => {
    it("should soft delete an issue", async () => {
      const createRes = await createIssue({
        summary: "Test Issue",
        status: "to_do",
        assignedToId: null,
        planId: null,
      });
      const created = await createRes.json();

      const { client, headers, team } = getCtx();
      const deleteRes = await client.issues[":issueKey"].$delete(
        {
          param: { issueKey: created.issue.key },
        },
        {
          headers: headers(),
        },
      );

      expect(deleteRes.status).toBe(200);
      const deleteJson = await deleteRes.json();
      expect(deleteJson.message).toBe("Issue deleted");

      const listRes = await client.issues.$get(
        {
          query: { teamKey: team.key },
        },
        {
          headers: headers(),
        },
      );
      const listJson = await listRes.json();
      expect(listJson.issues).toHaveLength(0);
    });
  });
});

