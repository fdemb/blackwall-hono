import { z } from "zod";

export const createTeamSchema = z.object({
    name: z.string().min(2).max(30),
    key: z.string().min(3).max(5),
    workspaceId: z.string().uuid(),
});

export type CreateTeam = z.infer<typeof createTeamSchema>;

export const teamParamsSchema = z.object({
    teamKey: z.string(),
});

export type TeamParams = z.infer<typeof teamParamsSchema>;
