import { z } from "zod";

const planBaseSchema = z.object({
  name: z.string().min(1).max(100),
  goal: z.string().max(500).nullable(),
  startDate: z.iso.date(),
  endDate: z.iso.date(),
});

const withValidDateRange = <TSchema extends z.ZodType<{ startDate: string; endDate: string }>>(
  schema: TSchema,
) =>
  schema.refine((data) => data.endDate >= data.startDate, {
    message: "End date must be on or after start date",
    path: ["endDate"],
  });

export const createIssuePlanSchema = withValidDateRange(
  planBaseSchema.extend({
    onUndoneIssues: z.enum(["moveToBacklog", "moveToNewPlan"]),
  }),
);

export type CreateIssuePlan = z.infer<typeof createIssuePlanSchema>;

import { issueSchema } from "../issues/issue.zod";

export const updateIssuePlanSchema = withValidDateRange(planBaseSchema);

export type UpdateIssuePlan = z.infer<typeof updateIssuePlanSchema>;

export const completeIssuePlanSchema = z.object({
  onUndoneIssues: z.enum(["moveToBacklog", "moveToNewPlan"]),
});

export type CompleteIssuePlan = z.infer<typeof completeIssuePlanSchema>;

export const issuePlanParamsSchema = z.object({
  teamKey: z.string(),
  planId: z.string().optional(),
});

export const issuePlanSchema = z.object({
  id: z.string(),
  name: z.string(),
  goal: z.string().nullable(),
  startDate: z.iso.date(),
  endDate: z.iso.date(),
  teamId: z.string(),
  createdById: z.string(),
  status: z.string().optional(), // active, completed, etc. if exists
  createdAt: z.string().optional(),
  updatedAt: z.string().optional(),
});

export const issuePlanListSchema = z.object({
  plans: z.array(issuePlanSchema),
});

export const issuePlanResponseSchema = z.object({
  plan: issuePlanSchema,
});

export const issuePlanWithIssuesSchema = z.object({
  plan: issuePlanSchema,
  issues: z.array(issueSchema),
});
