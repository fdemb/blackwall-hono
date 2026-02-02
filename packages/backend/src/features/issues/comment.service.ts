import { HTTPException } from "hono/http-exception";
import type { JSONContent } from "@tiptap/core";
import { issueData } from "./issue.data";
import { commentData } from "./comment.data";

async function getIssueOrThrow(workspaceId: string, issueKey: string) {
  const issue = await issueData.getIssueByKey({ workspaceId, issueKey });
  if (!issue) {
    throw new HTTPException(404, { message: "Issue not found" });
  }
  return issue;
}

export async function createComment(input: {
  workspaceId: string;
  issueKey: string;
  userId: string;
  content: JSONContent;
}) {
  const issue = await getIssueOrThrow(input.workspaceId, input.issueKey);

  return commentData.createComment({
    issue,
    authorId: input.userId,
    content: input.content,
  });
}

export async function deleteComment(input: {
  workspaceId: string;
  issueKey: string;
  commentId: string;
  userId: string;
}) {
  const issue = await getIssueOrThrow(input.workspaceId, input.issueKey);

  const comment = await commentData.getCommentById({
    commentId: input.commentId,
    issueId: issue.id,
  });

  if (!comment) {
    throw new HTTPException(404, { message: "Comment not found" });
  }

  await commentData.softDeleteComment({
    commentId: input.commentId,
    issue,
    actorId: input.userId,
  });
}

export const commentService = {
  createComment,
  deleteComment,
};
