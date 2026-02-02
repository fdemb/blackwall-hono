import { z } from "zod";

export const commentParamsSchema = z.object({
  issueKey: z.string(),
});

export type CommentParams = z.infer<typeof commentParamsSchema>;

export const createCommentSchema = z.object({
  content: z.any(),
});

export type CreateComment = z.infer<typeof createCommentSchema>;

export const deleteCommentParamsSchema = z.object({
  issueKey: z.string(),
  commentId: z.string(),
});

export type DeleteCommentParams = z.infer<typeof deleteCommentParamsSchema>;
