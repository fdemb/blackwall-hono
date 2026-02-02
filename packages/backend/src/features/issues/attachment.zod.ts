import { z } from "zod";

export const attachmentParamsSchema = z.object({
  issueKey: z.string(),
});

export type AttachmentParams = z.infer<typeof attachmentParamsSchema>;

export const associateAttachmentsSchema = z.object({
  attachmentIds: z.array(z.string()),
});

export type AssociateAttachments = z.infer<typeof associateAttachmentsSchema>;

export const deleteAttachmentParamsSchema = z.object({
  issueKey: z.string(),
  attachmentId: z.string(),
});

export type DeleteAttachmentParams = z.infer<typeof deleteAttachmentParamsSchema>;

export const getAttachmentParamsSchema = z.object({
  attachmentId: z.string(),
});

export type GetAttachmentParams = z.infer<typeof getAttachmentParamsSchema>;
