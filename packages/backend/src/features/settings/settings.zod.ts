import { z } from "zod";

export const updateProfileNameSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters").max(100),
});

export type UpdateProfileName = z.infer<typeof updateProfileNameSchema>;

export const changePasswordSchema = z
  .object({
    currentPassword: z.string().min(8, "Current password is required"),
    newPassword: z.string().min(8, "New password must be at least 8 characters"),
    revokeOtherSessions: z.boolean().optional(),
  })
  .refine((data) => data.currentPassword !== data.newPassword, {
    message: "New password must be different from the current password",
    path: ["newPassword"],
  });

export type ChangePassword = z.infer<typeof changePasswordSchema>;

export const updateWorkspaceSettingsSchema = z.object({
  displayName: z.string().min(2).max(30).optional(),
});

export type UpdateWorkspaceSettings = z.infer<typeof updateWorkspaceSettingsSchema>;

export const teamKeyParamSchema = z.object({
  teamKey: z.string(),
});

export type TeamKeyParam = z.infer<typeof teamKeyParamSchema>;

export const updateTeamSchema = z.object({
  name: z.string().min(1).max(100).optional(),
  key: z.string().min(1).max(5).toUpperCase().optional(),
});

export type UpdateTeam = z.infer<typeof updateTeamSchema>;

export const addTeamMemberSchema = z.object({
  userId: z.string().uuid(),
});

export type AddTeamMember = z.infer<typeof addTeamMemberSchema>;

export const removeTeamMemberParamSchema = z.object({
  teamKey: z.string(),
  userId: z.string(),
});

export type RemoveTeamMemberParam = z.infer<typeof removeTeamMemberParamSchema>;

export const createTeamSettingsSchema = z.object({
  name: z.string().min(1, "Name is required").max(100),
  key: z.string().min(1, "Key is required").max(5).toUpperCase(),
});

export type CreateTeamSettings = z.infer<typeof createTeamSettingsSchema>;
