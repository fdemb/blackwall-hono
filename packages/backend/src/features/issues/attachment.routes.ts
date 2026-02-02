import { Hono } from "hono";
import { zValidator } from "../../lib/validator";
import { attachmentService } from "./attachment.service";
import type { AppEnv } from "../../lib/hono-env";
import {
  attachmentParamsSchema,
  associateAttachmentsSchema,
  deleteAttachmentParamsSchema,
  getAttachmentParamsSchema,
} from "./attachment.zod";
import { HTTPException } from "hono/http-exception";

const attachmentRoutes = new Hono<AppEnv>()
  .post("/:issueKey/attachments", zValidator("param", attachmentParamsSchema), async (c) => {
    const workspace = c.get("workspace");
    const user = c.get("user")!;
    const { issueKey } = c.req.valid("param");

    const formData = await c.req.formData();
    const file = formData.get("file");

    if (!(file instanceof File)) {
      throw new HTTPException(400, { message: "Expected file" });
    }

    const attachment = await attachmentService.uploadAttachment({
      workspaceSlug: workspace.slug,
      workspaceId: workspace.id,
      issueKey,
      userId: user.id,
      file,
    });

    return c.json({ attachment });
  })
  .post("/attachments", async (c) => {
    const workspace = c.get("workspace");
    const user = c.get("user")!;

    const formData = await c.req.formData();
    const file = formData.get("file");

    if (!(file instanceof File)) {
      throw new HTTPException(400, { message: "Expected file" });
    }

    const attachment = await attachmentService.uploadAttachment({
      workspaceSlug: workspace.slug,
      workspaceId: workspace.id,
      issueKey: null,
      userId: user.id,
      file,
    });

    return c.json({ attachment });
  })
  .post(
    "/:issueKey/attachments/associate",
    zValidator("param", attachmentParamsSchema),
    zValidator("json", associateAttachmentsSchema),
    async (c) => {
      const workspace = c.get("workspace");
      const user = c.get("user")!;
      const { issueKey } = c.req.valid("param");
      const { attachmentIds } = c.req.valid("json");

      await attachmentService.associateAttachments({
        workspaceId: workspace.id,
        issueKey,
        userId: user.id,
        attachmentIds,
      });

      return c.json({ success: true });
    },
  )
  .get(
    "/:issueKey/attachments/:attachmentId",
    zValidator("param", deleteAttachmentParamsSchema),
    async (c) => {
      const workspace = c.get("workspace");
      const { issueKey, attachmentId } = c.req.valid("param");

      const attachment = await attachmentService.getAttachment({
        workspaceId: workspace.id,
        issueKey,
        attachmentId,
      });

      return c.json({ attachment });
    },
  )
  .delete(
    "/:issueKey/attachments/:attachmentId",
    zValidator("param", deleteAttachmentParamsSchema),
    async (c) => {
      const workspace = c.get("workspace");
      const user = c.get("user")!;
      const { issueKey, attachmentId } = c.req.valid("param");

      await attachmentService.deleteAttachment({
        workspaceId: workspace.id,
        issueKey,
        attachmentId,
        userId: user.id,
      });

      return c.json({ message: "Attachment deleted" });
    },
  );

// Separate route for downloading attachments (doesn't need issueKey)
const attachmentDownloadRoutes = new Hono<AppEnv>().get(
  "/attachments/:attachmentId/download",
  zValidator("param", getAttachmentParamsSchema),
  async (c) => {
    const user = c.get("user")!;
    const { attachmentId } = c.req.valid("param");

    const attachment = await attachmentService.getAttachmentForDownload({
      userId: user.id,
      attachmentId,
    });

    return c.json({ attachment });
  },
);

export { attachmentRoutes, attachmentDownloadRoutes };
