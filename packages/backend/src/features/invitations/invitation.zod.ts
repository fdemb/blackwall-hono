import * as z from "zod";

export const createInvitationSchema = z.object({
  email: z.string().email(),
});

export const invitationTokenParamsSchema = z.object({
  token: z.string().min(1),
});

export const registerAndAcceptInvitationSchema = z.object({
  name: z.string().min(2, "Name is required"),
  password: z.string().min(8, "Password must be at least 8 characters"),
});

export type CreateInvitationInput = z.infer<typeof createInvitationSchema>;
export type RegisterAndAcceptInvitationInput = z.infer<typeof registerAndAcceptInvitationSchema>;
