import type { JSONContent } from "@tiptap/core";
import { Hono } from "hono";
import { zValidator } from "../../lib/validator";
import { commentService } from "./comment.service";
import type { AppEnv } from "../../lib/hono-env";
import { authMiddleware } from "../auth/auth-middleware";
import { workspaceMiddleware } from "../workspaces/workspace-middleware";
import { commentParamsSchema, createCommentSchema, deleteCommentParamsSchema } from "./comment.zod";

const commentRoutes = new Hono<AppEnv>()
  .use("*", authMiddleware)
  .use("*", workspaceMiddleware)
  /**
   * POST /:issueKey/comments - Create a comment on an issue.
   */
  .post(
    "/:issueKey/comments",
    zValidator("param", commentParamsSchema),
    zValidator("json", createCommentSchema),
    async (c) => {
      const workspace = c.get("workspace");
      const user = c.get("user")!;
      const { issueKey } = c.req.valid("param");
      const { content } = c.req.valid("json");

      const comment = await commentService.createComment({
        workspaceId: workspace.id,
        issueKey,
        userId: user.id,
        content: content as JSONContent,
      });

      return c.json({ comment });
    },
  )
  /**
   * DELETE /:issueKey/comments/:commentId - Delete a comment from an issue.
   */
  .delete(
    "/:issueKey/comments/:commentId",
    zValidator("param", deleteCommentParamsSchema),
    async (c) => {
      const workspace = c.get("workspace");
      const user = c.get("user")!;
      const { issueKey, commentId } = c.req.valid("param");

      await commentService.deleteComment({
        workspaceId: workspace.id,
        issueKey,
        commentId,
        userId: user.id,
      });

      return c.json({ message: "Comment deleted" });
    },
  );

export { commentRoutes };
