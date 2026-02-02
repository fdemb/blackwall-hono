import { HTTPException } from "hono/http-exception";
import { issueData } from "./issue.data";
import { attachmentData } from "./attachment.data";
import { saveFile } from "../../lib/file-upload";

async function getIssueOrThrow(workspaceId: string, issueKey: string) {
  const issue = await issueData.getIssueByKey({ workspaceId, issueKey });
  if (!issue) {
    throw new HTTPException(404, { message: "Issue not found" });
  }
  return issue;
}

export async function uploadAttachment(input: {
  workspaceSlug: string;
  workspaceId: string;
  issueKey: string | null;
  userId: string;
  file: File;
}) {
  const originalFileName = input.file.name;
  const originalFileNameWithoutExtension = originalFileName.split(".").slice(0, -1).join(".");

  const filePath = await saveFile(input.file, {
    directory: `workspaces/${input.workspaceSlug}/issue-attachments`,
    name: originalFileNameWithoutExtension,
  });

  if (input.issueKey) {
    const issue = await getIssueOrThrow(input.workspaceId, input.issueKey);

    return attachmentData.createAttachment({
      issue,
      userId: input.userId,
      filePath,
      mimeType: input.file.type,
      originalFileName,
    });
  }

  return attachmentData.createOrphanAttachment({
    userId: input.userId,
    filePath,
    mimeType: input.file.type,
    originalFileName,
  });
}

export async function associateAttachments(input: {
  workspaceId: string;
  issueKey: string;
  userId: string;
  attachmentIds: string[];
}) {
  const issue = await getIssueOrThrow(input.workspaceId, input.issueKey);

  await attachmentData.associateAttachmentsWithIssue({
    userId: input.userId,
    issue,
    attachmentIds: input.attachmentIds,
  });
}

export async function getAttachment(input: {
  workspaceId: string;
  issueKey: string;
  attachmentId: string;
}) {
  const issue = await getIssueOrThrow(input.workspaceId, input.issueKey);

  const attachment = await attachmentData.getAttachmentById({
    attachmentId: input.attachmentId,
    issueId: issue.id,
  });

  if (!attachment) {
    throw new HTTPException(404, { message: "Attachment not found" });
  }

  return attachment;
}

export async function getAttachmentForDownload(input: { userId: string; attachmentId: string }) {
  const attachment = await attachmentData.getAttachmentForServing({
    userId: input.userId,
    attachmentId: input.attachmentId,
  });

  if (!attachment) {
    throw new HTTPException(404, { message: "Attachment not found" });
  }

  return attachment;
}

export async function deleteAttachment(input: {
  workspaceId: string;
  issueKey: string;
  attachmentId: string;
  userId: string;
}) {
  const issue = await getIssueOrThrow(input.workspaceId, input.issueKey);

  const attachment = await attachmentData.getAttachmentById({
    attachmentId: input.attachmentId,
    issueId: issue.id,
  });

  if (!attachment) {
    throw new HTTPException(404, { message: "Attachment not found" });
  }

  await attachmentData.deleteAttachment({
    attachmentId: input.attachmentId,
    issue,
    actorId: input.userId,
  });
}

export const attachmentService = {
  uploadAttachment,
  associateAttachments,
  getAttachment,
  getAttachmentForDownload,
  deleteAttachment,
};
