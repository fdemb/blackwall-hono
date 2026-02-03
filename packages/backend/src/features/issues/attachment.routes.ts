import { Hono } from "hono";
import { zValidator } from "../../lib/validator";
import { attachmentService } from "./attachment.service";
import type { AppEnv } from "../../lib/hono-env";
import { authMiddleware } from "../auth/auth-middleware";
import { workspaceMiddleware } from "../workspaces/workspace-middleware";
import {
  attachmentParamsSchema,
  associateAttachmentsSchema,
  deleteAttachmentParamsSchema,
  getAttachmentParamsSchema,
} from "./attachment.zod";
import { HTTPException } from "hono/http-exception";

const attachmentRoutes = new Hono<AppEnv>()
  .use("*", authMiddleware)
  .use("*", workspaceMiddleware)
  /**
   * POST /:issueKey/attachments - Upload an attachment to an issue.
   */
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
  /**
   * POST /attachments - Upload an orphan attachment (not linked to any issue yet).
   */
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
  /**
   * POST /:issueKey/attachments/associate - Associate orphan attachments with an issue.
   */
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
  /**
   * GET /:issueKey/attachments/:attachmentId - Get an attachment by its id.
   */
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
  /**
   * DELETE /:issueKey/attachments/:attachmentId - Delete an attachment from an issue.
   */
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

/**
 * GET /attachments/:attachmentId/download - Get attachment details for downloading.
 */
const attachmentDownloadRoutes = new Hono<AppEnv>()
  .use("*", authMiddleware)
  .use("*", workspaceMiddleware)
  .get(
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
