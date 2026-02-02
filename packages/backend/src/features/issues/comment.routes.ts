import type { JSONContent } from "@tiptap/core";
import { Hono } from "hono";
import { zValidator } from "../../lib/validator";
import { commentService } from "./comment.service";
import type { AppEnv } from "../../lib/hono-env";
import { commentParamsSchema, createCommentSchema, deleteCommentParamsSchema } from "./comment.zod";

const commentRoutes = new Hono<AppEnv>()
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
