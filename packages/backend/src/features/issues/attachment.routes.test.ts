import { describe, it, expect, afterEach } from "bun:test";
import { rmSync } from "node:fs";
import { useTestContext } from "../../test/context";
import { app } from "../../index";
import { env } from "../../lib/zod-env";

describe("Attachment Routes", () => {
  const getCtx = useTestContext();

  afterEach(() => {
    const { workspace } = getCtx();
    try {
      rmSync(`${env.FILES_DIR}/workspaces/${workspace.slug}`, { recursive: true, force: true });
    } catch {
      // Directory may not exist
    }
  });

  const createIssue = async () => {
    const { client, headers, team } = getCtx();
    const res = await client.issues.$post(
      {
        json: {
          teamKey: team.key,
          issue: {
            summary: "Test Issue",
            description: {},
            status: "backlog",
            assignedToId: null,
            planId: null,
          },
        },
      },
      {
        headers: headers(),
      },
    );
    const json = await res.json();
    return json.issue;
  };

  const createTestFile = (name = "test.png", type = "image/png") => {
    const content = new Uint8Array([0x89, 0x50, 0x4e, 0x47]); // PNG magic bytes
    return new File([content], name, { type });
  };

  const uploadAttachment = async (issueKey: string, file?: File) => {
    const { sessionCookie, workspace } = getCtx();
    const formData = new FormData();
    formData.append("file", file ?? createTestFile());

    const req = new Request(`http://localhost/issues/${issueKey}/attachments`, {
      method: "POST",
      headers: {
        Cookie: sessionCookie,
        "x-blackwall-workspace-slug": workspace.slug,
      },
      body: formData,
    });
    return app.request(req);
  };

  const uploadOrphanAttachment = async (file?: File) => {
    const { sessionCookie, workspace } = getCtx();
    const formData = new FormData();
    formData.append("file", file ?? createTestFile());

    const req = new Request("http://localhost/issues/attachments", {
      method: "POST",
      headers: {
        Cookie: sessionCookie,
        "x-blackwall-workspace-slug": workspace.slug,
      },
      body: formData,
    });
    return app.request(req);
  };

  describe("POST /issues/:issueKey/attachments", () => {
    it("should upload an attachment to an issue", async () => {
      const issue = await createIssue();
      const res = await uploadAttachment(issue.key);

      expect(res.status).toBe(200);
      const json = await res.json();
      expect(json.attachment).toHaveProperty("id");
      expect(json.attachment.issueId).toBe(issue.id);
      expect(json.attachment.originalFileName).toBe("test.png");
      expect(json.attachment.mimeType).toBe("image/png");
    });

    it("should return 404 for non-existent issue", async () => {
      const res = await uploadAttachment("NONEXISTENT-999");

      expect(res.status).toBe(404);
    });
  });

  describe("POST /issues/attachments", () => {
    it("should upload an orphan attachment", async () => {
      const res = await uploadOrphanAttachment();

      expect(res.status).toBe(200);
      const json = await res.json();
      expect(json.attachment).toHaveProperty("id");
      expect(json.attachment.issueId).toBeNull();
      expect(json.attachment.originalFileName).toBe("test.png");
    });
  });

  describe("POST /issues/:issueKey/attachments/associate", () => {
    it("should associate orphan attachments with an issue", async () => {
      const issue = await createIssue();

      // Upload orphan attachment
      const orphanRes = await uploadOrphanAttachment();
      const orphanJson = (await orphanRes.json()) as { attachment: { id: string } };

      // Associate with issue
      const { client, headers } = getCtx();
      const res = await client.issues[":issueKey"].attachments.associate.$post(
        {
          param: { issueKey: issue.key },
          json: { attachmentIds: [orphanJson.attachment.id] },
        },
        {
          headers: headers(),
        },
      );

      expect(res.status).toBe(200);
      const json = await res.json();
      expect(json.success).toBe(true);
    });

    it("should return 404 for non-existent issue", async () => {
      const { client, headers } = getCtx();
      const res = await client.issues[":issueKey"].attachments.associate.$post(
        {
          param: { issueKey: "NONEXISTENT-999" },
          json: { attachmentIds: ["00000000-0000-0000-0000-000000000000"] },
        },
        {
          headers: headers(),
        },
      );

      expect(res.status).toBe(404);
    });
  });

  describe("GET /issues/:issueKey/attachments/:attachmentId", () => {
    it("should get an attachment", async () => {
      const issue = await createIssue();
      const uploadRes = await uploadAttachment(issue.key);
      const uploadJson = (await uploadRes.json()) as { attachment: { id: string } };

      const { client, headers } = getCtx();
      const res = await client.issues[":issueKey"].attachments[":attachmentId"].$get(
        {
          param: { issueKey: issue.key, attachmentId: uploadJson.attachment.id },
        },
        {
          headers: headers(),
        },
      );

      expect(res.status).toBe(200);
      const json = await res.json();
      expect(json.attachment.id).toBe(uploadJson.attachment.id);
    });

    it("should return 404 for non-existent attachment", async () => {
      const issue = await createIssue();

      const { client, headers } = getCtx();
      const res = await client.issues[":issueKey"].attachments[":attachmentId"].$get(
        {
          param: { issueKey: issue.key, attachmentId: "00000000-0000-0000-0000-000000000000" },
        },
        {
          headers: headers(),
        },
      );

      expect(res.status).toBe(404);
    });
  });

  describe("DELETE /issues/:issueKey/attachments/:attachmentId", () => {
    it("should delete an attachment", async () => {
      const issue = await createIssue();
      const uploadRes = await uploadAttachment(issue.key);
      const uploadJson = (await uploadRes.json()) as { attachment: { id: string } };

      const { client, headers } = getCtx();
      const res = await client.issues[":issueKey"].attachments[":attachmentId"].$delete(
        {
          param: { issueKey: issue.key, attachmentId: uploadJson.attachment.id },
        },
        {
          headers: headers(),
        },
      );

      expect(res.status).toBe(200);
      const json = await res.json();
      expect(json.message).toBe("Attachment deleted");
    });

    it("should return 404 for non-existent attachment", async () => {
      const issue = await createIssue();

      const { client, headers } = getCtx();
      const res = await client.issues[":issueKey"].attachments[":attachmentId"].$delete(
        {
          param: { issueKey: issue.key, attachmentId: "00000000-0000-0000-0000-000000000000" },
        },
        {
          headers: headers(),
        },
      );

      expect(res.status).toBe(404);
    });
  });

  describe("GET /issues/attachments/:attachmentId/download", () => {
    it("should get attachment for download", async () => {
      const issue = await createIssue();
      const uploadRes = await uploadAttachment(issue.key);
      const uploadJson = (await uploadRes.json()) as { attachment: { id: string } };

      const { client, headers } = getCtx();
      const res = await client.issues.attachments[":attachmentId"].download.$get(
        {
          param: { attachmentId: uploadJson.attachment.id },
        },
        {
          headers: headers(),
        },
      );

      expect(res.status).toBe(200);
      const json = await res.json();
      expect(json.attachment.id).toBe(uploadJson.attachment.id);
    });

    it("should return 404 for non-existent attachment", async () => {
      const { client, headers } = getCtx();
      const res = await client.issues.attachments[":attachmentId"].download.$get(
        {
          param: { attachmentId: "00000000-0000-0000-0000-000000000000" },
        },
        {
          headers: headers(),
        },
      );

      expect(res.status).toBe(404);
    });
  });
});
