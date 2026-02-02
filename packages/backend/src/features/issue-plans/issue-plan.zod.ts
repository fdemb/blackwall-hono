import { z } from "zod";

export const createIssuePlanSchema = z.object({
    name: z.string().min(1).max(100),
    goal: z.string().max(500).nullable(),
    startDate: z.coerce.date(),
    endDate: z.coerce.date(),
    onUndoneIssues: z.enum(["moveToBacklog", "moveToNewPlan"]),
});

export type CreateIssuePlan = z.infer<typeof createIssuePlanSchema>;

export const updateIssuePlanSchema = z.object({
    name: z.string().min(1).max(100),
    goal: z.string().max(500).nullable(),
    startDate: z.coerce.date(),
    endDate: z.coerce.date(),
});

export type UpdateIssuePlan = z.infer<typeof updateIssuePlanSchema>;
